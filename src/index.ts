import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import doctorsRoutes from './routes/doctorsServices';
import ambulancesRoutes from './routes/ambulancesServices';

const app = express();
const locationsPath = path.join(__dirname, 'data', 'locationsData.json');

app.use(cors());
// Middleware to parse JSON request bodies
app.use(express.json());

// Function to read locations from the JSON file
const readLocations = (): string[] => {
    try {
        const data = fs.readFileSync(locationsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading locations:', error);
        return [];
    }
};

// Endpoint to fetch locations for dropdown
app.get('/api/locations', (req: Request, res: Response) => {
    const locations = readLocations();
    res.status(200).json({ locations });
});

// Use the routes for doctors and ambulances
app.use('/api/doctors', doctorsRoutes);
app.use('/api/ambulances', ambulancesRoutes);

// Default route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Ambulance and Doctor Services');
});

// Set up the port and start the server
const port = 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
