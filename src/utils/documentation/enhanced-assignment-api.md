# Enhanced Assignment System API Documentation

## Overview

This API provides functionality for a comprehensive enhanced assignment system for an educational platform. The system includes challenge-based assessments (MCQs, coding problems, file uploads), question management, improved admin functionality, student progress tracking, auto-grading capabilities, and detailed analytics.

## Base URL

All endpoints are relative to: `http://localhost:5600/api/v1`

## Authentication

Most endpoints require authentication. Use Bearer token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Admin MCQ Question Management

### Get all MCQ questions
- **GET** `/admin/mcq`
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
  - `difficulty` (optional): Filter by difficulty (easy, medium, hard)
  - `page` (optional): Page number for pagination
  - `limit` (optional): Results per page
- **Response**: List of MCQ questions with pagination

### Get MCQ question by ID
- **GET** `/admin/mcq/{id}`
- **Response**: MCQ question details

### Get MCQ questions for specific assignment
- **GET** `/admin/mcq/assignment/{number}`
- **Path Parameters**:
  - `number`: Assignment number
- **Query Parameters**:
  - `difficulty` (optional): Filter by difficulty
- **Response**: List of MCQ questions for the specified assignment

### Create MCQ question
- **POST** `/admin/mcq`
- **Request Body**:
  ```json
  {
    "assignmentNumber": 1,
    "question": "What is the correct syntax for declaring a variable in JavaScript?",
    "options": ["var x = 5;", "variable x = 5;", "x := 5;", "int x = 5;"],
    "correctAnswer": 0,
    "explanation": "In JavaScript, variables can be declared using the var, let, or const keywords.",
    "difficulty": "medium"
  }
  ```
- **Response**: Created MCQ question with ID

### Update MCQ question
- **PATCH** `/admin/mcq/{id}`
- **Path Parameters**:
  - `id`: MCQ question ID
- **Request Body**: Same format as create, with only fields to update
- **Response**: Updated MCQ question

### Delete MCQ question
- **DELETE** `/admin/mcq/{id}`
- **Path Parameters**:
  - `id`: MCQ question ID
- **Response**: Success message

## Admin Coding Problem Management

### Get all coding problems
- **GET** `/admin/coding`
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
  - `difficulty` (optional): Filter by difficulty
  - `page` (optional): Page number for pagination
  - `limit` (optional): Results per page
- **Response**: List of coding problems with pagination

### Get coding problem by ID
- **GET** `/admin/coding/{id}`
- **Response**: Coding problem details

### Get coding problems for specific assignment
- **GET** `/admin/coding/assignment/{number}`
- **Path Parameters**:
  - `number`: Assignment number
- **Query Parameters**:
  - `difficulty` (optional): Filter by difficulty
- **Response**: List of coding problems for the specified assignment

### Create coding problem
- **POST** `/admin/coding`
- **Request Body**:
  ```json
  {
    "assignmentNumber": 1,
    "title": "Sum of Two Numbers",
    "description": "Write a function that returns the sum of two numbers.",
    "difficulty": "easy",
    "timeLimit": 30,
    "testCases": [
      {
        "input": "2, 3",
        "output": "5",
        "isHidden": false
      },
      {
        "input": "-1, 1",
        "output": "0",
        "isHidden": true
      }
    ],
    "starterCode": "function sum(a, b) {\n  // Your code here\n}",
    "constraints": ["Time complexity: O(1)", "Space complexity: O(1)"]
  }
  ```
- **Response**: Created coding problem with ID

### Update coding problem
- **PATCH** `/admin/coding/{id}`
- **Path Parameters**:
  - `id`: Coding problem ID
- **Request Body**: Same format as create, with only fields to update
- **Response**: Updated coding problem

### Delete coding problem
- **DELETE** `/admin/coding/{id}`
- **Path Parameters**:
  - `id`: Coding problem ID
- **Response**: Success message

## Admin Challenge Management

### Get all challenges
- **GET** `/admin/challenges`
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
  - `type` (optional): Filter by challenge type
  - `page` (optional): Page number for pagination
  - `limit` (optional): Results per page
- **Response**: List of challenges with pagination

### Get challenge by ID
- **GET** `/admin/challenges/{id}`
- **Response**: Challenge details

### Create challenge
- **POST** `/admin/challenges`
- **Request Body**:
  ```json
  {
    "type": "mcq_quiz",
    "assignmentNumber": 1,
    "title": "JavaScript Basics Quiz",
    "description": "Test your knowledge of JavaScript fundamentals.",
    "maxScore": 15,
    "timeLimit": 20,
    "questionCount": 10
  }
  ```
  OR
  ```json
  {
    "type": "coding_challenge",
    "assignmentNumber": 1,
    "title": "Algorithm Challenge",
    "description": "Solve the problem using JavaScript.",
    "maxScore": 20,
    "timeLimit": 45,
    "problemId": "60d21b4667d0d8992e610c85"
  }
  ```
  OR
  ```json
  {
    "type": "file_upload",
    "assignmentNumber": 1,
    "title": "Project Submission",
    "description": "Submit your completed project files.",
    "maxScore": 25
  }
  ```
- **Response**: Created challenge with ID

### Update challenge
- **PATCH** `/admin/challenges/{id}`
- **Path Parameters**:
  - `id`: Challenge ID
- **Request Body**: Same format as create, with only fields to update
- **Response**: Updated challenge

### Delete challenge
- **DELETE** `/admin/challenges/{id}`
- **Path Parameters**:
  - `id`: Challenge ID
- **Response**: Success message

## Admin Grading Management

### Configure auto-grading
- **POST** `/admin/grading/auto-config`
- **Request Body**:
  ```json
  {
    "assignmentNumber": 1,
    "challengeType": "mcq_quiz",
    "gradingCriteria": {
      "passingScore": 60,
      "timeWeighting": 0.1,
      "penaltyForIncorrect": 0.25
    },
    "enabled": true
  }
  ```
- **Response**: Updated auto-grading configuration

### Get auto-grading configuration
- **GET** `/admin/grading/auto-config/{assignmentNumber}`
- **Path Parameters**:
  - `assignmentNumber`: Assignment number
- **Response**: Auto-grading configurations for the assignment

### Trigger bulk grading
- **POST** `/admin/grading/bulk-grade/{assignmentNumber}`
- **Path Parameters**:
  - `assignmentNumber`: Assignment number
- **Response**: Grading results or status

### Get student progress
- **GET** `/admin/grading/student-progress/{studentId}`
- **Path Parameters**:
  - `studentId`: Student ID
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
- **Response**: Comprehensive progress report for the student

### Get assignment analytics
- **GET** `/admin/grading/analytics/{assignmentNumber}`
- **Path Parameters**:
  - `assignmentNumber`: Assignment number
- **Response**: Detailed analytics for the assignment

## Student Challenge Endpoints

### Get available challenges
- **GET** `/challenges/assignment/{number}`
- **Path Parameters**:
  - `number`: Assignment number
- **Response**: Available challenges and student's selection status

### Select challenges
- **POST** `/challenges/assignment/{number}/select`
- **Path Parameters**:
  - `number`: Assignment number
- **Request Body**:
  ```json
  {
    "challengeIds": ["mcq-quiz-1-1", "coding-challenge-1-2"]
  }
  ```
- **Response**: Selection confirmation

### Start MCQ quiz
- **GET** `/challenges/mcq/{challengeId}/start`
- **Path Parameters**:
  - `challengeId`: MCQ quiz challenge ID
- **Response**: Quiz questions

### Submit MCQ quiz
- **POST** `/challenges/mcq/{challengeId}/submit`
- **Path Parameters**:
  - `challengeId`: MCQ quiz challenge ID
- **Request Body**:
  ```json
  {
    "answers": [
      {
        "questionId": "60d21b4667d0d8992e610c85",
        "selectedAnswer": 2
      },
      {
        "questionId": "60d21b4667d0d8992e610c86",
        "selectedAnswer": 0
      }
    ],
    "timeTaken": 540
  }
  ```
- **Response**: Quiz results and score

### Get coding challenge
- **GET** `/challenges/code/{challengeId}`
- **Path Parameters**:
  - `challengeId`: Coding challenge ID
- **Response**: Coding challenge details with starter code

### Run test case
- **POST** `/challenges/code/{challengeId}/run`
- **Path Parameters**:
  - `challengeId`: Coding challenge ID
- **Request Body**:
  ```json
  {
    "code": "function sum(a, b) {\n  return a + b;\n}",
    "testCaseIndex": 0
  }
  ```
- **Response**: Test case execution result

### Submit coding solution
- **POST** `/challenges/code/{challengeId}/submit`
- **Path Parameters**:
  - `challengeId`: Coding challenge ID
- **Request Body**:
  ```json
  {
    "code": "function sum(a, b) {\n  return a + b;\n}",
    "timeTaken": 1200
  }
  ```
- **Response**: Submission results with test outcomes

### Get challenge completion status
- **GET** `/challenges/status/{assignmentNumber}`
- **Path Parameters**:
  - `assignmentNumber`: Assignment number
- **Response**: Challenge completion status for the student

## File Upload Challenge Endpoints

### Get file upload challenge
- **GET** `/filechallenges/challenge/{challengeId}`
- **Path Parameters**:
  - `challengeId`: File upload challenge ID
- **Response**: File upload challenge details

### Submit file for challenge
- **POST** `/filechallenges/challenge/{challengeId}/submit`
- **Path Parameters**:
  - `challengeId`: File upload challenge ID
- **Request Body**: `multipart/form-data` with file and optional comments
- **Response**: Submission confirmation

### Get file submission details
- **GET** `/filechallenges/submission/{submissionId}`
- **Path Parameters**:
  - `submissionId`: Submission ID
- **Response**: File submission details

### Get all student submissions
- **GET** `/filechallenges/submissions`
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
- **Response**: List of all file submissions for the current student

### Download submitted file
- **GET** `/filechallenges/submission/{submissionId}/download`
- **Path Parameters**:
  - `submissionId`: Submission ID
- **Response**: File download

## Admin File Upload Management

### Get all file submissions
- **GET** `/admin/file-uploads/submissions/{assignmentNumber}`
- **Path Parameters**:
  - `assignmentNumber`: Assignment number
- **Query Parameters**:
  - `status` (optional): Filter by grading status (graded, pending, all)
- **Response**: List of file submissions for the assignment

### Get specific file submission
- **GET** `/admin/file-uploads/submission/{submissionId}`
- **Path Parameters**:
  - `submissionId`: File submission ID
- **Response**: Detailed submission information

### Grade file submission
- **POST** `/admin/file-uploads/submission/{submissionId}/grade`
- **Path Parameters**:
  - `submissionId`: File submission ID
- **Request Body**:
  ```json
  {
    "score": 85,
    "feedback": "Good work, but could improve code organization"
  }
  ```
- **Response**: Confirmation of grading

### Download submitted file (admin)
- **GET** `/admin/file-uploads/submission/{submissionId}/download`
- **Path Parameters**:
  - `submissionId`: File submission ID
- **Response**: File download

## Admin File Upload Analytics

### Get Submission Statistics
- **GET** `/admin/analytics/file-uploads/stats`
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
- **Response**: Statistics about file submissions including total counts, completion rates, and score distribution

### Get File Access Analytics
- **GET** `/admin/analytics/file-uploads/access`
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
  - `startDate` (optional): Start date for date range filtering (YYYY-MM-DD)
  - `endDate` (optional): End date for date range filtering (YYYY-MM-DD)
- **Response**: Analytics about file views and downloads, including top accessed submissions

### Get Student Engagement Metrics
- **GET** `/admin/analytics/file-uploads/engagement`
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
- **Response**: Metrics about student participation and engagement with file upload submissions

### Get Submission Trends
- **GET** `/admin/analytics/file-uploads/trends`
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
  - `interval` (optional): Time interval for grouping (hour, day, week, month)
- **Response**: Submission counts and rates over time grouped by specified interval

### Get Grading Insights
- **GET** `/admin/analytics/file-uploads/grading`
- **Query Parameters**:
  - `assignmentNumber` (optional): Filter by assignment number
- **Response**: Insights about grading patterns including score distribution, grading time, and feedback metrics

## WebSocket Events

The API includes real-time features using WebSocket connections:

### Challenges Namespace
- **Connection**: `/challenges`
- **Events**:
  - `join-challenge`: Join a challenge room
  - `quiz-submitted`: Notify when a quiz is submitted
  - `code-submitted`: Notify when code is submitted
  - `test-case-run`: Notify when a test case is run
  - `file-uploaded`: Notify when a file is uploaded
  - `submission-graded`: Notify when a submission is graded
  - `grading-started`: Notify when auto-grading starts
  - `grading-progress`: Notify about auto-grading progress
  - `grading-complete`: Notify when auto-grading completes
  - `grade-notification`: Personal notification for a student when their submission is graded

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200/201`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Server Error
