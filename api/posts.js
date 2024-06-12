const express = require('express');
const postsRouter = express.Router();

const { requireUser } = require('./utils');

const { 
  createPost,
  getAllPosts,
  updatePost,
  getPostById,
  deletePost
} = require('../db');

postsRouter.get('/', async (req, res, next) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter(post => {
      // the post is active, doesn't matter who it belongs to
      if (post.active) {
        return true;
      }
    
      // the post is not active, but it belogs to the current user
      if (req.user && post.author.id === req.user.id) {
        return true;
      }
    
      // none of the above are true
      return false;
    });
  
    res.send({
      posts
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.post('/', requireUser, async (req, res, next) => {
  const { title, content = "", tags =[] } = req.body;

  const postData = {
    authorId: req.user.id,
    title,
    content,
    tags: Array.isArray(tags) ? tags : []
  };

  try {
    console.log(" Received postData:", postData);

    const post = await createPost(postData);

    if (post) {
      res.send(post);
    } else {
      next({
        name: 'PostCreationError',
        message: 'There was an error creating your post. Please try again.'
      })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost })
    } else {
      next({
        name: 'UnauthorizedUserError',
        message: 'You cannot update a post that is not yours'
      })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
  // res.send({ message: 'under construction' });
  try {
    const {postId} = req.params;
    const post = await getPostById(postId);

    console.log("Post", post)
    console.log("Author", post.author.id);

    if (post && post.author.id === req.user.id) {

      const deletedPost = await deletePost(postId);

      res.send({ message: "Post deleted successfully", post: deletedPost });
    } else {
      res.status(403).send({
        name: "UnauthorizedUserError",
        message: "You cannot delete a post that is not yours"
      });
    }
    
  } catch (error) {
    next(error);
  }
});

module.exports = postsRouter;