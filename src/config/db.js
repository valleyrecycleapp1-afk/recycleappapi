import { sql } from '@vercel/postgres';
import 'dotenv/config';

async function initDB() {
    try {
        console.log('🔄 Initializing database...');
        
        // Create users table for roles
        await sql`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        console.log('✅ Users table created/verified.');

        // Create vehicle_inspections table (single unified schema)
        await sql`CREATE TABLE IF NOT EXISTS vehicle_inspections (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            time VARCHAR(50),
            vehicle VARCHAR(255),
            speedometer_reading VARCHAR(50),
            defective_items JSONB,
            truck_trailer_items JSONB,
            trailer_number VARCHAR(100),
            remarks TEXT,
            condition_satisfactory BOOLEAN DEFAULT true,
            driver_signature VARCHAR(255),
            defects_corrected BOOLEAN DEFAULT false,
            defects_need_correction BOOLEAN DEFAULT false,
            mechanic_signature VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_by VARCHAR(255)
        )`;
        console.log('✅ Vehicle inspections table created/verified.');

        // Create inspection_images table for Cloudinary integration
        await sql`CREATE TABLE IF NOT EXISTS inspection_images (
            id SERIAL PRIMARY KEY,
            inspection_id INTEGER REFERENCES vehicle_inspections(id) ON DELETE CASCADE,
            file_name VARCHAR(255) NOT NULL,
            cloudinary_url VARCHAR(500) NOT NULL,
            cloudinary_public_id VARCHAR(255) NOT NULL,
            image_type VARCHAR(50) DEFAULT 'defect_photo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            uploaded_by VARCHAR(255),
            width INTEGER,
            height INTEGER,
            file_size INTEGER,
            is_private BOOLEAN DEFAULT true,
            resource_type VARCHAR(50) DEFAULT 'image',
            format VARCHAR(20) DEFAULT 'jpg',
            vehicle_id VARCHAR(255),
            vehicle_folder VARCHAR(255),
            context_metadata JSONB
        )`;
        console.log('✅ Inspection images table created/verified.');

        // Add indexes for better performance
        await sql`CREATE INDEX IF NOT EXISTS idx_inspection_images_inspection_id ON inspection_images(inspection_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_inspection_images_type ON inspection_images(image_type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_user_id ON vehicle_inspections(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date ON vehicle_inspections(date)`;
        console.log('✅ Database indexes created/verified.');

        console.log("✅ Database initialized successfully.");
        
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        // Exit if the database can't be set up, as the app is unusable.
        process.exit(1);
    }
}

export { sql, initDB };