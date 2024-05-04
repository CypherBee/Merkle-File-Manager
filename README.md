# Merkle File Manager


## Introduction
This project is a client-server file management system utilizing a custom-implemented Merkle tree to ensure the integrity of files during upload and retrieval. The system allows secure uploading and verification of files using Merkle root hashes. It supports multiple upload batches with each batch treated as a distinct Merkle tree, ensuring robust file integrity checks.

## Architecture
![alt-text](https://diagrams.helpful.dev/d/d:X3sQJApC)

## Technologies Used
- **NestJs**: Backend framework
- **ExpressJs**: Backend routing
- **ReactJs**: Frontend framework
- **Postgres with Prisma**: Database management (development was performed using Neon Serverless Postgres)
- **Docker/Docker-compose**: Used for deployment and service orchestration

## System Design
The system architecture includes a client and a server with both frontend and backend components. The backend handles file uploads, constructing Merkle trees, and generating unique identifiers for each file batch. The server stores the files and updates tracking information in its database. The client frontend is designed to display and retrieve files directly from the server.

## Implementation
### Server
- **REST API Endpoints**: POST /files, GET /files, and GET /fileId.
- **Upload Module**: Manages file uploads into the server's 'upload' directory.
- **Database Module**: Interacts with the database for file tracking.
- **Helper Files Module**: Provides simplified APIs for database operations.

### Client Backend
- Manages REST API endpoints POST /files and GET /fileId.
- Handles file processing, including Merkle root computation for each upload batch and storing details in `merkleRoot.txt`.
- Verifies proofs of file integrity received from the server.

### Client Frontend
- Provides a basic UI for visualizing the application flow and interaction.

## Future Improvements
- **Code Clarity and Type Safety**: Improvements in code readability and error reduction.
- **Error Handling**: Systematic error management and logging.
- **Data Transfer Objects (DTOs)**: Refinement in API interactions for robustness.
- **Compression**: Introduction of data compression for better storage efficiency.
- **API Enhancements**: Improvement of the API for enhanced performance.

## Running the Application
Use `docker-compose up --build` to start the services. 
Initialize the database with:
```bash
docker exec -it server npx prisma migrate dev --name init
```

Check the database table creation:
```bash
docker exec -it postgres-db psql -U postgres 
```
One inside the container run:

```bash
\dt
```
## Testing
The application was stress-tested by uploading 1,000 small files simultaneously and performing multiple multi-file uploads and verifications. The system effectively managed high volumes of data and multiple upload batches.

## Contributions
Feel free to contribute, Use & improve the project.
