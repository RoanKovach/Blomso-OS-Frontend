# Design System Architecture

## Role: Principal Architect

Design a high-level system architecture for the feature or application described in the prompt.

**Feature Description**: `$ARGUMENTS`

## Architecture Design Document

### 1. Overview
- **Goal**: What is the primary objective of this system?
- **Scope**: What are the boundaries? What is in-scope and out-of-scope?
- **Constraints**: What are the known technical or business constraints (e.g., budget, timeline, existing technology stack)?

### 2. High-Level Diagram
- Create a block diagram showing the main components of the system and how they interact.
- Use simple labels (e.g., "Web Client," "API Gateway," "User Service," "Database").

### 3. Component Breakdown
- For each component in the diagram, provide a brief description of its responsibilities.
- **Example**:
    - **API Gateway**: Handles incoming requests, authentication, and routing to appropriate microservices.
    - **User Service**: Manages user data, registration, and profiles.

### 4. Data Model
- Propose a preliminary data model.
- List the main entities and their key attributes.
- Describe the relationships between entities (e.g., one-to-many, many-to-many).

### 5. Technology Stack
- Recommend a technology stack for each component.
- Justify your choices (e.g., "Use PostgreSQL for its robustness and support for complex queries").

### 6. Key Considerations
- **Scalability**: How will the system handle growth?
- **Security**: What are the primary security concerns and how will they be addressed?
- **Reliability**: How will you ensure the system is resilient and available?
- **Deployment**: Briefly outline a deployment strategy.

---

*Think like an architect. Focus on the big picture and the relationships between components. The goal is to create a solid foundation for future development.*