var feathers = require('feathers');
var TodoStore = require('./todos');
var Tekhnotron = require('./tekhnotron/app');
var _ = require('underscore');
var limiter = require('rate-limiter');

var app = feathers().configure(feathers.socketio())
  .use(limiter.expressMiddleware([
    ['/todos', 'post', 1, 1, 418],
    ['/todos', 'put', 1, 1, 418],
    ['/todos', 'delete', 1, 1, 418]
  ]))
  .use(feathers.vhost('tekhnotron.com', Tekhnotron))
  .use(feathers.vhost('www.tekhnotron.com', Tekhnotron))
  .use('todos', new TodoStore());

var noop = function() {};

setInterval(function updateTodos() {
  var todoService = app.lookup('todos');
  todoService.find({}, function(error, allTodos) {
    var todos = _.filter(allTodos, function(todo) {
      return todo.server;
    });
    var todo = todos[0];
    var text = 'Seriously, try it out!';

    if(!todo) {
      todoService.create({ description: 'Check out Feathers!', done: false, server: true }, {}, noop);
    } else if(todo.description !== text) {
      todoService.update(todo.id, _.extend(todo, { done: false, description: text }), {}, noop);
    } else if(!todo.done) {
      todoService.update(todo.id, _.extend(todo, { done: true }), {}, noop);
    } else {
      todoService.remove(todo.id, {}, function() {});
    }
  });
}, 3000);

app.listen(process.env.PORT || 3000);