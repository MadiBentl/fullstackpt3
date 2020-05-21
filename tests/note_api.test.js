const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const api = supertest(app)
const testHelper = require('./test_helper')
const bcrypt = require('bcrypt')

const Note = require('../models/note.js')
const User = require('../models/user.js')
let token = ''

beforeEach(async () => {
  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('password', 10)
  const user = new User({ username: 'HolyMonkey', name: 'His Holiness', passwordHash })

  await api
    .post('/api/users')
    .send(user)

  await user.save()
  await Note.deleteMany({})

  const noteObjects = testHelper.initialNotes.map(note => new Note(note))
  const promiseArr = noteObjects.map(note => note.save())
  await Promise.all(promiseArr)
})

test('notes are returned as json', async () => {
  await api
    .get('/api/notes')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('a valid note can be added', async () => {
  const loggedIn = await api.post('/api/login').send({ username: 'HolyMonkey', password: 'password' })
  token = loggedIn.body.token

  const newNote = {
    content: 'async/await simplifies making async calls',
    important: true
  }

  await api
    .post('/api/notes')
    .send(newNote)
    .set('Authorization', `Bearer ${token}`)
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

  console.log(noteToView)

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
