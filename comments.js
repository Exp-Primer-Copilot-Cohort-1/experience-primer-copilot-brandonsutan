// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes } = require('crypto');
const axios = require('axios');

// Create express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create route to get comments by post id
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create route to post comments by post id

app.post('/posts/:id/comments', async (req, res) => {
  // Create comment id
  const commentId = randomBytes(4).toString('hex');
  // Get content from body
  const { content } = req.body;
  // Get comments from post id
  const comments = commentsByPostId[req.params.id] || [];
  // Add new comment to comments
  comments.push({ id: commentId, content, status: 'pending' });
  // Update comments
  commentsByPostId[req.params.id] = comments;
  // Send event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: { id: commentId, content, postId: req.params.id, status: 'pending' },
  });
  // Send response
  res.status(201).send(comments);
}
);

// Create route to receive events from event bus

app.post('/events', async (req, res) => {
    // Get event from body
    const { type, data } = req.body;
    // Check if event type is CommentModerated
    if (type === 'CommentModerated') {
        // Get comments from post id
        const comments = commentsByPostId[data.postId];
        // Get comment from comments
        const comment = comments.find(comment => comment.id === data.id);
        // Update status
        comment.status = data.status;
        // Send event to event bus
        await axios.post('http://event-bus-srv:4005/events', {
        type: 'CommentUpdated',
        data: { id: data.id, content: data.content, postId: data.postId, status: data.status },
        });
    }
    // Send response
    res.send({});
    }
);