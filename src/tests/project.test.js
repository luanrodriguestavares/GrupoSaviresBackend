const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

describe('Project Management', () => {
    let token;
    let userId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});

        const user = await User.create({
            username: 'testuser',
            phoneNumber: '1234567890',
            password: 'password123',
            role: 'Engineer',
            userType: 'engineer',
        });

        userId = user._id;
        token = jwt.sign({ userId, userType: 'engineer' }, process.env.JWT_SECRET);
    });

    it('should create a new project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Project',
                description: 'This is a test project',
                status: 'active',
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Project created successfully');
        expect(res.body.project).toHaveProperty('name', 'Test Project');
    });

    it('should get all projects for an engineer', async () => {
        await Project.create({
            name: 'Test Project 1',
            description: 'This is test project 1',
            status: 'active',
        });

        await Project.create({
            name: 'Test Project 2',
            description: 'This is test project 2',
            status: 'paused',
        });

        const res = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveLength(2);
    });
});

