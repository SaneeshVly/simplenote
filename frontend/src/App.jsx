import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { apiRequest } from './api'

const initialUserForm = { name: '', email: '' }
const initialLoginForm = { email: '' }
const initialMessageForm = { text: '' }

const decodeUserIdFromToken = (token) => {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const payload = JSON.parse(atob(payloadPart))
    return payload.id ? Number(payload.id) : null
  } catch (error) {
    return null
  }
}

function App() {
  const [users, setUsers] = useState([])
  const [userForm, setUserForm] = useState(initialUserForm)
  const [loginForm, setLoginForm] = useState(initialLoginForm)
  const [messageForm, setMessageForm] = useState(initialMessageForm)
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [conversation, setConversation] = useState([])
  const [status, setStatus] = useState('Ready')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [connectingSocket, setConnectingSocket] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [onlineUserIds, setOnlineUserIds] = useState([])
  const [typingUserIds, setTypingUserIds] = useState([])
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const currentUserId = useMemo(() => decodeUserIdFromToken(token), [token])
  const selectedUser = users.find((user) => Number(user.id) === Number(selectedUserId))
  const selectedUserOnline = onlineUserIds.includes(Number(selectedUserId))
  const selectedUserTyping = typingUserIds.includes(Number(selectedUserId))

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const data = await apiRequest('/api/users')
      setUsers(Array.isArray(data) ? data : [])
      setStatus('Users loaded')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadConversation = async (targetUserId) => {
    if (!token || !targetUserId) {
      setConversation([])
      return
    }

    try {
      const data = await apiRequest(`/api/messages/conversation/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversation(Array.isArray(data) ? data : [])
    } catch (error) {
      setStatus(error.message)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    loadConversation(selectedUserId)
  }, [selectedUserId, token])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setSocketConnected(false)
      setOnlineUserIds([])
      setTypingUserIds([])
      return
    }

    setConnectingSocket(true)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
    const socket = io(socketUrl, { auth: { token } })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnectingSocket(false)
      setSocketConnected(true)
      setStatus('Socket connected')
    })

    socket.on('connect_error', (error) => {
      setConnectingSocket(false)
      setSocketConnected(false)
      setStatus(`Socket error: ${error.message}`)
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    socket.on('presence_sync', (payload) => {
      setOnlineUserIds(Array.isArray(payload?.onlineUserIds) ? payload.onlineUserIds : [])
    })

    socket.on('presence_update', (payload) => {
      const userId = Number(payload?.userId)
      const online = Boolean(payload?.online)
      if (!userId) return

      setOnlineUserIds((prev) => {
        if (online) {
          if (prev.includes(userId)) return prev
          return [...prev, userId]
        }
        return prev.filter((id) => id !== userId)
      })
    })

    socket.on('typing', (payload) => {
      const userId = Number(payload?.userId)
      const isTyping = Boolean(payload?.isTyping)
      const recipientId = Number(payload?.recipientId)
      if (!userId || recipientId !== Number(currentUserId)) return

      setTypingUserIds((prev) => {
        if (isTyping) {
          if (prev.includes(userId)) return prev
          return [...prev, userId]
        }
        return prev.filter((id) => id !== userId)
      })
    })

    socket.on('private_message', (incoming) => {
      const fromMe = Number(incoming.userId) === Number(currentUserId)
      const inActiveConversation =
        Number(incoming.userId) === Number(selectedUserId) ||
        Number(incoming.recipientId) === Number(selectedUserId)

      if (!fromMe && !inActiveConversation) return

      setConversation((prev) => {
        if (prev.some((item) => item.id === incoming.id)) return prev
        return [...prev, incoming]
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, currentUserId, selectedUserId])

  const createUser = async (event) => {
    event.preventDefault()
    setStatus('Creating user...')
    try {
      await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userForm)
      })
      setUserForm(initialUserForm)
      await fetchUsers()
      setStatus('User created')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const login = async (event) => {
    event.preventDefault()
    setStatus('Logging in...')
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      })

      if (!data?.token) {
        throw new Error('Token not returned by API')
      }

      localStorage.setItem('token', data.token)
      setToken(data.token)
      setConversation([])
      setStatus('Login successful')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    setStatus('Sending message...')

    if (!selectedUserId) {
      setStatus('Select a user to chat with')
      return
    }

    if (!socketRef.current || !socketRef.current.connected) {
      setStatus('Socket is not connected')
      return
    }

    try {
      await new Promise((resolve, reject) => {
        socketRef.current.emit('private_message', {
          text: messageForm.text,
          recipientId: Number(selectedUserId)
        }, (result) => {
          if (!result?.ok) {
            reject(new Error(result?.error || 'Unable to send message'))
            return
          }
          resolve(result.message)
        })
      })
      socketRef.current.emit('typing', {
        recipientId: Number(selectedUserId),
        isTyping: false
      })
      setMessageForm(initialMessageForm)
      setStatus('Message sent')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleMessageInput = (value) => {
    setMessageForm({ text: value })

    if (!socketRef.current || !socketRef.current.connected || !selectedUserId) return

    socketRef.current.emit('typing', {
      recipientId: Number(selectedUserId),
      isTyping: value.trim().length > 0
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && socketRef.current.connected && selectedUserId) {
        socketRef.current.emit('typing', {
          recipientId: Number(selectedUserId),
          isTyping: false
        })
      }
    }, 1000)
  }

  return (
    <main className="container">
      <h1>SimpleNote Frontend</h1>
      <p className="status">Status: {status}</p>

      <section className="card">
        <h2>Create User</h2>
        <form onSubmit={createUser} className="form">
          <input
            placeholder="Name"
            value={userForm.name}
            onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={userForm.email}
            onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
            required
          />
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="card">
        <h2>Login</h2>
        <form onSubmit={login} className="form">
          <input
            placeholder="Email"
            type="email"
            value={loginForm.email}
            onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
            required
          />
          <button type="submit">Login</button>
        </form>
        <p className="token">
          Token: {token ? `${token.slice(0, 24)}...` : 'Not logged in'}
        </p>
        <p className="token">
          Socket: {token ? (connectingSocket ? 'Connecting...' : socketConnected ? 'Connected' : 'Disconnected') : 'Login required'}
        </p>
      </section>

      <section className="card">
        <h2>One-to-One Chat</h2>
        <p className="presence">
          Chatting with: {selectedUser ? `${selectedUser.name}` : 'nobody selected'}{' '}
          {selectedUser ? (
            <span className={selectedUserOnline ? 'onlineBadge' : 'offlineBadge'}>
              {selectedUserOnline ? 'online' : 'offline'}
            </span>
          ) : null}
        </p>
        <select
          value={selectedUserId}
          onChange={(event) => setSelectedUserId(event.target.value)}
        >
          <option value="">Select user</option>
          {users
            .filter((user) => Number(user.id) !== Number(currentUserId))
            .map((user) => (
              <option key={user.id} value={user.id}>
                #{user.id} {user.name} ({user.email})
              </option>
            ))}
        </select>

        <div className="messagesBox">
          {selectedUserTyping && <p className="typingText">{selectedUser?.name || 'User'} is typing...</p>}
          {conversation.map((message) => (
            <div
              key={message.id}
              className={
                Number(message.userId) === Number(currentUserId)
                  ? 'message mine'
                  : 'message theirs'
              }
            >
              <strong>#{message.userId}</strong>: {message.text}
            </div>
          ))}
          {!conversation.length && <p>No messages yet.</p>}
        </div>

        <form onSubmit={sendMessage} className="form">
          <textarea
            placeholder="Message text"
            value={messageForm.text}
            onChange={(event) => handleMessageInput(event.target.value)}
            required
          />
          <button type="submit">Send</button>
        </form>
      </section>

      <section className="card">
        <h2>Users</h2>
        <button onClick={fetchUsers} disabled={loadingUsers}>
          {loadingUsers ? 'Refreshing...' : 'Refresh users'}
        </button>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              #{user.id} {user.name} ({user.email}){' '}
              <span className={onlineUserIds.includes(Number(user.id)) ? 'onlineBadge' : 'offlineBadge'}>
                {onlineUserIds.includes(Number(user.id)) ? 'online' : 'offline'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
