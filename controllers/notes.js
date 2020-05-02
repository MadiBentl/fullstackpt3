const notesRouter = require('express').Router()
const Note = require('../models/note')

notesRouter.get('/', async (req, res) => {
  const notes = await Note.find({})
  res.json(notes.map(note => note.toJSON()))
})

notesRouter.get('/:id', async (req, res) => {
  const note = await Note.findById(req.params.id)
  if (note) {
    res.json(note.toJSON())
  } else {
    res.status(404).end()
  }
})

notesRouter.post('/', async (req, res) => {
  const body = req.body
  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date()
  })
  const savedNote = await note.save()
  res.json(savedNote.toJSON())
})

notesRouter.delete('/:id', async (req, res) => {
  await Note.findByIdAndRemove(req.params.id)
  res.status(204).end()
})

notesRouter.put(':/id', async (req, res) => {
  const body = req.bodyParser
  const note = {
    content: body.content,
    important: body.important
  }

  let updatedNote = await Note.findByIdAndUpdate(req.params.id, note, { new:true })
  res.json(updatedNote.toJSON())
})

module.exports = notesRouter
