// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { TaskStatus } from '@nv-internal/prisma-client'
import {
  createMockAdminUser,
  createMockWorkerUser,
} from '../../../test/mock-auth'
import { createTestApp } from '../../../test/test-app'

// Mock task service and attachment service used by the route
jest.mock('../task.service', () => ({
  canUserCreateTask: jest.fn(),
  canUserListTasks: jest.fn(),
  canUserUpdateTaskAssignees: jest.fn(),
  canUserUpdateTaskStatus: jest.fn(),
  canUserViewTask: jest.fn(),
  createTask: jest.fn(),
  getTaskById: jest.fn(),
  getTaskList: jest.fn(),
  updateTaskAssignees: jest.fn(),
  updateTaskStatus: jest.fn(),
}))

jest.mock('../../attachment/attachment.service', () => ({
  uploadTaskAttachments: jest.fn(),
}))

import * as attachmentService from '../../attachment/attachment.service'
import * as taskService from '../task.service'

function asMock<T extends (...args: unknown[]) => unknown>(fn: T) {
  return fn as unknown as jest.Mock<ReturnType<T>, Parameters<T>>
}

describe('Task Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /v1/task', () => {
    it('returns list for admin (all tasks)', async () => {
      const admin = createMockAdminUser()
      const app = createTestApp(admin)

      asMock(taskService.canUserListTasks).mockResolvedValue(true)
      asMock(taskService.getTaskList).mockResolvedValue({
        tasks: [
          {
            id: 1,
            title: 'T1',
            description: null,
            status: TaskStatus.PREPARING,
            assigneeIds: [],
            customerId: 'cust_1',
            geoLocationId: 'geo_1',
            startedAt: null,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: 'c1',
              createdAt: new Date(),
              updatedAt: new Date(),
              name: 'C',
              phone: '0',
            },
            geoLocation: {
              id: 'g1',
              createdAt: new Date(),
              updatedAt: new Date(),
              name: 'L',
              address: 'A',
              lat: 1,
              lng: 2,
            },
            attachments: [],
          },
        ],
        nextCursor: '1',
        hasNextPage: false,
      })

      const res = await app.request('/v1/task?take=5')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.tasks).toHaveLength(1)
      expect(taskService.canUserListTasks).toHaveBeenCalled()
      expect(taskService.getTaskList).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, assignedUserIds: undefined }),
      )
    })

    it('returns assigned tasks for worker when assignedOnly=true', async () => {
      const worker = createMockWorkerUser({ id: 'worker_123' })
      const app = createTestApp(worker)

      // When assignedOnly=true, route does not require canUserListTasks
      asMock(taskService.getTaskList).mockResolvedValue({
        tasks: [],
        nextCursor: undefined,
        hasNextPage: false,
      })

      const res = await app.request('/v1/task?assignedOnly=true')
      expect(res.status).toBe(200)
      expect(taskService.canUserListTasks).not.toHaveBeenCalled()
      expect(taskService.getTaskList).toHaveBeenCalledWith(
        expect.objectContaining({ assignedUserIds: ['worker_123'] }),
      )
    })

    it('rejects worker listing all tasks with 403', async () => {
      const worker = createMockWorkerUser()
      const app = createTestApp(worker)
      asMock(taskService.canUserListTasks).mockResolvedValue(false)

      const res = await app.request('/v1/task')
      expect(res.status).toBe(403)
    })
  })

  describe('POST /v1/task', () => {
    const payload = {
      title: 'New Task',
      description: 'Desc',
      customerName: 'C',
      customerPhone: '0123456789',
      geoLocation: { name: 'L', address: 'A', lat: 1, lng: 2 },
    }

    it('creates task for admin and returns 201', async () => {
      const admin = createMockAdminUser()
      const app = createTestApp(admin)

      asMock(taskService.canUserCreateTask).mockResolvedValue(true)
      asMock(taskService.createTask).mockResolvedValue({
        id: 1,
        title: payload.title,
        description: payload.description,
        status: TaskStatus.PREPARING,
        assigneeIds: [],
        customerId: 'cust_1',
        geoLocationId: 'geo_1',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'c1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'C',
          phone: '0',
        },
        geoLocation: {
          id: 'g1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'L',
          address: 'A',
          lat: 1,
          lng: 2,
        },
        attachments: [],
      })

      const res = await app.request('/v1/task', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.id).toBe(1)
      expect(taskService.createTask).toHaveBeenCalled()
    })

    it('returns 403 when user cannot create', async () => {
      const worker = createMockWorkerUser()
      const app = createTestApp(worker)
      asMock(taskService.canUserCreateTask).mockResolvedValue(false)

      const res = await app.request('/v1/task', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(res.status).toBe(403)
    })
  })

  describe('GET /v1/task/:id', () => {
    it('returns 404 when task not found', async () => {
      const admin = createMockAdminUser()
      const app = createTestApp(admin)
      asMock(taskService.getTaskById).mockResolvedValue(null)

      const res = await app.request('/v1/task/999')
      expect(res.status).toBe(404)
    })

    it('returns 403 when user cannot view task', async () => {
      const worker = createMockWorkerUser()
      const app = createTestApp(worker)
      asMock(taskService.getTaskById).mockResolvedValue({
        id: 1,
        title: 'T',
        description: null,
        status: TaskStatus.PREPARING,
        assigneeIds: [],
        customerId: 'c',
        geoLocationId: 'g',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'c1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'C',
          phone: '0',
        },
        geoLocation: {
          id: 'g1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'L',
          address: 'A',
          lat: 1,
          lng: 2,
        },
        attachments: [],
      })
      asMock(taskService.canUserViewTask).mockResolvedValue(false)

      const res = await app.request('/v1/task/1')
      expect(res.status).toBe(403)
    })

    it('returns 200 with task when permitted', async () => {
      const admin = createMockAdminUser()
      const app = createTestApp(admin)
      const task: Task = {
        id: 1,
        title: 'T',
        description: null,
        status: TaskStatus.PREPARING,
        assigneeIds: [],
        customerId: 'c',
        geoLocationId: 'g',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'c1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'C',
          phone: '0',
        },
        geoLocation: {
          id: 'g1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'L',
          address: 'A',
          lat: 1,
          lng: 2,
        },
        attachments: [],
      }
      asMock(taskService.getTaskById).mockResolvedValue(task)
      asMock(taskService.canUserViewTask).mockResolvedValue(true)

      const res = await app.request('/v1/task/1')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.id).toBe(1)
    })
  })

  describe('PUT /v1/task/:id/assignees', () => {
    it('returns 403 when user cannot update assignees', async () => {
      const worker = createMockWorkerUser()
      const app = createTestApp(worker)
      asMock(taskService.canUserUpdateTaskAssignees).mockResolvedValue(false)

      const res = await app.request('/v1/task/1/assignees', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assigneeIds: ['a'] }),
      })
      expect(res.status).toBe(403)
    })

    it('updates and returns 200 for admin', async () => {
      const admin = createMockAdminUser()
      const app = createTestApp(admin)
      asMock(taskService.canUserUpdateTaskAssignees).mockResolvedValue(true)
      asMock(taskService.updateTaskAssignees).mockResolvedValue({ id: 1 })

      const res = await app.request('/v1/task/1/assignees', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assigneeIds: ['a', 'b'] }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.id).toBe(1)
      expect(taskService.updateTaskAssignees).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: 1, assigneeIds: ['a', 'b'] }),
      )
    })
  })

  describe('POST /v1/task/:id/attachments', () => {
    it('uploads attachments and returns 201', async () => {
      const worker = createMockWorkerUser({ id: 'worker_1' })
      const app = createTestApp(worker)
      asMock(attachmentService.uploadTaskAttachments).mockResolvedValue([
        { id: 'att_1' },
      ])

      const form = new FormData()
      const blob = new Blob(['hello'], { type: 'text/plain' })
      form.append('files', blob, 'hello.txt')

      const res = await app.request('/v1/task/1/attachments', {
        method: 'POST',
        body: form,
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.attachments).toHaveLength(1)
      expect(attachmentService.uploadTaskAttachments).toHaveBeenCalled()
    })

    it('maps service errors to status codes (404, 403, 500)', async () => {
      const worker = createMockWorkerUser()
      const app = createTestApp(worker)

      // 404 via TASK_NOT_FOUND message
      asMock(attachmentService.uploadTaskAttachments).mockRejectedValueOnce(
        new Error('TASK_NOT_FOUND'),
      )
      let res = await app.request('/v1/task/999/attachments', {
        method: 'POST',
        body: new FormData(),
      })
      expect(res.status).toBe(404)

      // 403 via explicit status
      asMock(attachmentService.uploadTaskAttachments).mockRejectedValueOnce({
        status: 403,
        message: 'forbidden',
      })
      res = await app.request('/v1/task/1/attachments', {
        method: 'POST',
        body: new FormData(),
      })
      expect(res.status).toBe(403)

      // default 500
      asMock(attachmentService.uploadTaskAttachments).mockRejectedValueOnce(
        new Error('unknown'),
      )
      res = await app.request('/v1/task/1/attachments', {
        method: 'POST',
        body: new FormData(),
      })
      expect(res.status).toBe(500)
    })
  })

  describe('PUT /v1/task/:id/status', () => {
    it('returns 404 when task not found', async () => {
      const worker = createMockWorkerUser()
      const app = createTestApp(worker)
      asMock(taskService.getTaskById).mockResolvedValue(null)

      const res = await app.request('/v1/task/1/status', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: TaskStatus.READY }),
      })
      expect(res.status).toBe(404)
    })

    it('returns 403 Not assigned when cannot update and user not in assignees', async () => {
      const worker = createMockWorkerUser({ id: 'worker_2' })
      const app = createTestApp(worker)
      const task: Task = {
        id: 1,
        title: 'T',
        description: null,
        status: TaskStatus.PREPARING,
        assigneeIds: ['worker_1'],
        customerId: 'c',
        geoLocationId: 'g',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'c1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'C',
          phone: '0',
        },
        geoLocation: {
          id: 'g1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'L',
          address: 'A',
          lat: 1,
          lng: 2,
        },
        attachments: [],
      }
      asMock(taskService.getTaskById).mockResolvedValue(task)
      asMock(taskService.canUserUpdateTaskStatus).mockResolvedValue(false)

      const res = await app.request('/v1/task/1/status', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: TaskStatus.READY }),
      })
      expect(res.status).toBe(403)
      const bodyText = await res.text()
      expect(bodyText).toMatch('Bạn không được phân công')
    })

    it('returns 403 Invalid transition when assigned but cannot update', async () => {
      const worker = createMockWorkerUser({ id: 'worker_1' })
      const app = createTestApp(worker)
      const task: Task = {
        id: 1,
        title: 'T',
        description: null,
        status: TaskStatus.PREPARING,
        assigneeIds: ['worker_1'],
        customerId: 'c',
        geoLocationId: 'g',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'c1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'C',
          phone: '0',
        },
        geoLocation: {
          id: 'g1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'L',
          address: 'A',
          lat: 1,
          lng: 2,
        },
        attachments: [],
      }
      asMock(taskService.getTaskById).mockResolvedValue(task)
      asMock(taskService.canUserUpdateTaskStatus).mockResolvedValue(false)

      const res = await app.request('/v1/task/1/status', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: TaskStatus.READY }),
      })
      expect(res.status).toBe(403)
      const bodyText = await res.text()
      expect(bodyText).toMatch('Không thể chuyển trạng thái')
    })

    it('updates status when permitted', async () => {
      const admin = createMockAdminUser()
      const app = createTestApp(admin)
      const task: Task = {
        id: 1,
        title: 'T',
        description: null,
        status: TaskStatus.PREPARING,
        assigneeIds: [],
        customerId: 'c',
        geoLocationId: 'g',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'c1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'C',
          phone: '0',
        },
        geoLocation: {
          id: 'g1',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'L',
          address: 'A',
          lat: 1,
          lng: 2,
        },
        attachments: [],
      }
      asMock(taskService.getTaskById).mockResolvedValue(task)
      asMock(taskService.canUserUpdateTaskStatus).mockResolvedValue(true)
      asMock(taskService.updateTaskStatus).mockResolvedValue({ id: 1 })

      const res = await app.request('/v1/task/1/status', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: TaskStatus.READY }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.id).toBe(1)
      expect(taskService.updateTaskStatus).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: 1, status: TaskStatus.READY }),
      )
    })
  })
})
