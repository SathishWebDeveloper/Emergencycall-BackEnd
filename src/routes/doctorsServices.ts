import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const dataPath = path.join(__dirname, '..', 'data', 'doctorsData.json');
const locationsPath = path.join(__dirname, '..', 'data', 'locationsData.json');

// Read doctors data
const readDoctorsData = async (): Promise<any[]> => {
    try {
        const data = await fs.promises.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading doctor data:', error);
        return [];
    }
};

// Write doctors data
const writeDoctorsData = async (data: any[]): Promise<void> => {
    try {
        await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing doctor data:', error);
    }
};

// Read locations data
const readLocations = (): string[] => {
    try {
        const data = fs.readFileSync(locationsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading locations:', error);
        return [];
    }
};

// Write locations data
const writeLocations = (locations: string[]): void => {
    try {
        fs.writeFileSync(locationsPath, JSON.stringify(locations, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing locations:', error);
    }
};

// GET: List all doctors or filter by location
router.get('/', async (req: any, res: any): Promise<void> => {
    const { location } = req.query;
    const doctors = await readDoctorsData();

    if (location) {
        const filteredDoctors = doctors.filter((doctor: any) => doctor.location === location);
        if (filteredDoctors.length > 0) {
            return res.status(200).json({ total: filteredDoctors.length, results: filteredDoctors });
        }
        return res.status(404).json({ message: `No doctors found for location: ${location}` });
    }

    if (doctors.length > 0) {
        res.status(200).json({ total: doctors.length, results: doctors });
    } else {
        res.status(404).json({ message: 'No doctors found' });
    }
});

// POST: Add a new doctor
router.post('/', async (req: any, res: any): Promise<void> => {
    const { name, description, location, image } = req.body;

    const doctors = await readDoctorsData();
    const id = doctors.length ? doctors[doctors.length - 1].id + 1 : 1;

    const newDoctor = { id, name, description, location, image };
    doctors.push(newDoctor);
    await writeDoctorsData(doctors);

    // Check if the location already exists and add if necessary
    let locations = readLocations();
    if (!locations.includes(location)) {
        locations.push(location);
        writeLocations(locations);
    }

    res.status(201).json(newDoctor);
});

// PUT: Update an existing doctor by id
router.put('/:id', async (req: any, res: any): Promise<void> => {
    const { id } = req.params;
    const { name, description, location, image } = req.body;

    const doctors = await readDoctorsData();
    const doctorIndex = doctors.findIndex((doctor: any) => doctor.id === parseInt(id));

    if (doctorIndex === -1) {
        return res.status(404).json({ message: 'Doctor not found' });
    }

    const updatedDoctor = { id: parseInt(id), name, description, location, image };
    doctors[doctorIndex] = updatedDoctor;

    await writeDoctorsData(doctors);

    // Update locations if needed
    let locations = readLocations();
    if (!locations.includes(location)) {
        locations.push(location);
        writeLocations(locations);
    }

    res.status(200).json(updatedDoctor);
});

// DELETE: Delete a doctor by id
router.delete('/:id', async (req: any, res: any): Promise<void> => {
    const { id } = req.params;

    let doctors = await readDoctorsData();
    doctors = doctors.filter((doctor: any) => doctor.id !== parseInt(id));

    if (doctors.length === (await readDoctorsData()).length) {
        return res.status(404).json({ message: 'Doctor not found' });
    }

    await writeDoctorsData(doctors);
    res.status(200).json({ message: `Doctor with id ${id} deleted successfully` });
});

export default router;
