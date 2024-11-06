
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const dataPath = path.join(__dirname, '../data', 'ambulancesData.json');
const locationsPath = path.join(__dirname, '../data', 'locationsData.json');

// Read ambulances data
const readAmbulancesData = async (): Promise<any[]> => {
    try {
        const data = await fs.promises.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading ambulance data:', error);
        return [];
    }
};

// Write ambulances data
const writeAmbulancesData = async (data: any[]): Promise<void> => {
    try {
        await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing ambulance data:', error);
    }
};

// Read locations data
const readLocations = (): string[] => {
    try {
        const data = fs.readFileSync(locationsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading locations data:', error);
        return [];
    }
};

// Write locations data
const writeLocations = (locations: string[]): void => {
    try {
        fs.writeFileSync(locationsPath, JSON.stringify(locations, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing locations data:', error);
    }
};

// Add new location if it doesn't exist
const addLocationIfNotExists = (newLocation: string): void => {
    const locations = readLocations();
    if (!locations.includes(newLocation)) {
        locations.push(newLocation);
        writeLocations(locations);
    }
};

// GET: List all ambulances or filter by location
router.get('/', async (req: any, res: any): Promise<void> => {
    const { location } = req.query;
    const ambulances = await readAmbulancesData();

    if (location) {
        const filteredAmbulances = ambulances.filter((ambulance: any) => ambulance.location === location);
        if (filteredAmbulances.length > 0) {
            return res.status(200).json({ total: filteredAmbulances.length, results: filteredAmbulances });
        }
        return res.status(404).json({ message: `No ambulances found for location: ${location}` });
    }

    if (ambulances.length > 0) {
        res.status(200).json({ total: ambulances.length, results: ambulances });
    } else {
        res.status(404).json({ message: 'No ambulances found' });
    }
});

// POST: Add a new ambulance with location
router.post('/', async (req: any, res: any): Promise<void> => {
    const { name, description, location, image } = req.body;

    const ambulances = await readAmbulancesData();
    const id = ambulances.length ? ambulances[ambulances.length - 1].id + 1 : 1;

    const newAmbulance = { id, name, description, location, image };

    ambulances.push(newAmbulance);
    await writeAmbulancesData(ambulances);

    // Add location if it doesn't already exist
    addLocationIfNotExists(location);

    res.status(201).json(newAmbulance);
});

// PUT: Update an existing ambulance by id
router.put('/:id', async (req: any, res: any): Promise<void> => {
    const { id } = req.params;
    const { name, description, location, image } = req.body;

    const ambulances = await readAmbulancesData();
    const ambulanceIndex = ambulances.findIndex((ambulance: any) => ambulance.id === parseInt(id));

    if (ambulanceIndex === -1) {
        return res.status(404).json({ message: 'Ambulance not found' });
    }

    const updatedAmbulance = { id: parseInt(id), name, description, location, image };
    ambulances[ambulanceIndex] = updatedAmbulance;

    await writeAmbulancesData(ambulances);

    // Add location if it doesn't already exist
    addLocationIfNotExists(location);

    res.status(200).json(updatedAmbulance);
});

// DELETE: Delete an ambulance by id
router.delete('/:id', async (req: any, res: any): Promise<void> => {
    const { id } = req.params;

    let ambulances = await readAmbulancesData();
    ambulances = ambulances.filter((ambulance: any) => ambulance.id !== parseInt(id));

    if (ambulances.length === (await readAmbulancesData()).length) {
        return res.status(404).json({ message: 'Ambulance not found' });
    }

    await writeAmbulancesData(ambulances);
    res.status(200).json({ message: `Ambulance with id ${id} deleted successfully` });
});

export default router;
