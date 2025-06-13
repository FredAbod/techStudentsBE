# WebSocket Integration & File Access Tracking Documentation

## Overview

The enhanced assignment system includes real-time features through WebSocket connections that enable instant notifications for various events including file submissions, grading activities, and file access tracking. This document outlines the WebSocket integration and file access tracking functionality.

## WebSocket Connection

### Connection URL
```
ws://localhost:5600
```

### Connection Parameters
The following query parameters should be included when establishing a WebSocket connection:

- `type`: The channel type to join (challenge, assignment, user, admin)
- `id`: The ID specific to the channel type (challengeId, assignmentNumber, userId)

Example:
```
ws://localhost:5600?type=challenge&id=file-upload-1
```

## Channel Types

### Challenge Channel
- **Format**: `challenge-{challengeId}`
- **Description**: Channel for events related to a specific challenge
- **Events**:
  - `user-joined`: When a user joins the challenge
  - `submission-update`: When a submission is made to the challenge
  - `submission-graded`: When a submission is graded

### Assignment Channel
- **Format**: `assignment-{assignmentNumber}`
- **Description**: Channel for events related to a specific assignment
- **Events**:
  - `grading-update`: Updates about the grading process for the assignment

### User Channel
- **Format**: `user-{userId}`
- **Description**: Personal channel for a specific user
- **Events**:
  - `grade-notification`: Notification when user's submission is graded

### Admin Channel
- **Format**: `admin-channel` or `admin-file-activity`
- **Description**: Channels for admin-specific events and monitoring
- **Events**:
  - `file-activity`: File access events (views and downloads)
  - `analytics-update`: Updates to analytics data

## Event Types

### Submission Update Events

#### File Upload Event
```json
{
  "type": "file",
  "userId": "user_id",
  "fileName": "assignment.pdf",
  "timestamp": "2025-06-13T12:00:00Z"
}
```

#### Submission Graded Event
```json
{
  "studentId": "student_id",
  "score": 85,
  "hasFeedback": true,
  "timestamp": "2025-06-13T14:30:00Z"
}
```

### File Access Events

#### File View Event
```json
{
  "type": "view",
  "submissionId": "submission_id",
  "studentId": "student_id",
  "timestamp": "2025-06-13T15:45:00Z"
}
```

#### File Download Event
```json
{
  "type": "download",
  "submissionId": "submission_id",
  "studentId": "student_id",
  "timestamp": "2025-06-13T16:20:00Z"
}
```

## File Access Tracking

The system tracks student interactions with file submissions through the `FileAccess` model. This tracking enables analytics about student engagement with feedback and submissions.

### Tracked Events

- **View**: When a student views their submission details
- **Download**: When a student downloads their submitted file

### FileAccess Model Structure

```javascript
{
  studentId: ObjectId,      // Reference to Student model
  submissionId: ObjectId,   // Reference to FileSubmission model
  accessedAt: Date,         // When the access occurred
  accessType: String        // "view" or "download"
}
```

## WebSocket Simulation API

### Simulate Event
- **POST** `/api/v1/simulate-event`
- **Request Body**:
  ```json
  {
    "channelType": "challenge",
    "channelId": "file-upload-1",
    "eventType": "submission-update",
    "data": {
      "type": "file",
      "userId": "user_id",
      "fileName": "example.pdf"
    }
  }
  ```
- **Response**: Confirmation of event simulation

### Simulate File Access
- **POST** `/api/v1/simulate-file-access`
- **Request Body**:
  ```json
  {
    "accessType": "view",
    "submissionId": "submission_id",
    "studentId": "student_id"
  }
  ```
- **Response**: Confirmation of file access event simulation

## Implementing WebSocket in Frontend Applications

### Connection Example
```javascript
// Connect to a challenge channel
const socket = new WebSocket(`ws://localhost:5600?type=challenge&id=${challengeId}`);

// Event listeners
socket.onopen = () => {
  console.log('Connected to WebSocket server');
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received message:', data);
  
  // Handle different event types
  if (data.type === 'submission-graded') {
    // Show grading notification
  } else if (data.type === 'file') {
    // Show file submission update
  }
};
```

### Monitoring File Access Events
```javascript
// Connect to admin file activity channel
const socket = new WebSocket('ws://localhost:5600?type=admin&id=file-activity');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'view' || data.type === 'download') {
    console.log(`File ${data.type} event:`, data);
    // Update dashboard or analytics in real-time
  }
};
```
