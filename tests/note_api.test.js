const supertest = require('supertest')

const mongoose = require('mongoose')
const app = require('../app')
const api = supertest(app)
const testHelper = require('./test_helper')

const Note = require('../models/note.js')


beforeEach(async () => {
  await Note.deleteMany({})

  let noteObject = new Note(testHelper.initialNotes[0])
  await noteObject.save()

  noteObject = new Note(testHelper.initialNotes[1])
  await noteObject.save()
})

test('notes are returned as json', async () => {
  await api
    .get('/api/notes')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('a valid note can be added', async () => {
  const newNote = {
    content: 'async/await simplifies making async calls',
    important: true,
  }

  await api
    .post('/api/notes')
    .send(newNote)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const res = await testHelper.notesInDb()
  expect(res).toHaveLength(testHelper.initialNotes.length + 1)


  const contents = res.map(r => r.content)

  expect(contents).toContain('async/await simplifies making async calls')
})

test('Note without content is not added', async () => {
  const newNote = {
    important: true
  }

  await api
    .post('/api/notes')
    .send(newNote)
    .expect(400)

  const res = await testHelper.notesInDb()

  expect(res).toHaveLength(testHelper.initialNotes.length)

})

test('a specific note can be viewed', async () => {
  const notesAtStart = await testHelper.notesInDb()

  const noteToView = notesAtStart[0]
  noteToView.date = noteToView.date.toJSON()
  const resultNote = await api
    .get(`/api/notes/${noteToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(resultNote.body).toEqual(noteToView)
})

test('a note can be deleted', async () => {
  const notesAtStart = await testHelper.notesInDb()
  const noteToDelete = notesAtStart[0]

  console.log('noteToDel', noteToDelete)
  await api
    .delete(`/api/notes/${noteToDelete.id}`)
    .expect(204)

  const notesAtEnd = await testHelper.notesInDb()

  expect(notesAtEnd).toHaveLength(testHelper.initialNotes.length - 1)

  const content = notesAtEnd.map(r => r.content)

  expect(content).not.toContain(noteToDelete.content)
})

test('all notes are returned', async () => {
  const response = await api.get('/api/notes')
  expect(response.body.length).toBe(testHelper.initialNotes.length)
})

test('a specific note is within the returned notes', async () => {
  const response = await api.get('/api/notes')
  const contents = response.body.map(r => r.content)
  expect(contents).toContain('Browser can execute only Javascript')
})

afterAll(() => {
  mongoose.connection.close()
})
