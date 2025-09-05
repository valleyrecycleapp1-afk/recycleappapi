import { sql } from '@vercel/postgres';
import 'dotenv/config';

async function migrateDatabase() {
    try {
        console.log('🔄 Starting database migration...');
        
        // Drop old tables if they exist with wrong schema
        console.log('🗑️ Cleaning up old table structures...');
        
        // First, drop the foreign key constraints and old tables
        await sql`DROP TABLE IF EXISTS inspection_images CASCADE`;
        console.log('✅ Old inspection_images table dropped');
        
        // Check if vehicle_inspections has the wrong schema and recreate it
        try {
            // Try to check the current schema
            const tableInfo = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'vehicle_inspections'
                ORDER BY ordinal_position
            `;
            
            const columns = tableInfo.rows || tableInfo;
            const hasCorrectSchema = columns.some(col => col.column_name === 'defective_items' && col.data_type === 'jsonb');
            
            if (!hasCorrectSchema) {
                console.log('🔄 Recreating vehicle_inspections table with correct schema...');
                await sql`DROP TABLE IF EXISTS vehicle_inspections CASCADE`;
                console.log('✅ Old vehicle_inspections table dropped');
            }
        } catch (error) {
            console.log('ℹ️ Table does not exist yet, will create new one');
        }
        
        // Create users table
        await sql`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        console.log('✅ Users table created/verified.');

        // Create vehicle_inspections table with correct schema
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
        console.log('✅ Vehicle inspections table created with correct schema.');

        // Create inspection_images table for Cloudinary
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
        console.log('✅ Inspection images table created for Cloudinary.');

        // Add indexes for better performance
        await sql`CREATE INDEX IF NOT EXISTS idx_inspection_images_inspection_id ON inspection_images(inspection_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_inspection_images_type ON inspection_images(image_type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_user_id ON vehicle_inspections(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date ON vehicle_inspections(date)`;
        console.log('✅ Database indexes created.');

        // Test the tables
        console.log('🧪 Testing table structure...');
        const userCount = await sql`SELECT COUNT(*) as count FROM users`;
        const inspectionCount = await sql`SELECT COUNT(*) as count FROM vehicle_inspections`;
        const imageCount = await sql`SELECT COUNT(*) as count FROM inspection_images`;
        
        console.log(`📊 Current data: ${(userCount.rows || userCount)[0].count} users, ${(inspectionCount.rows || inspectionCount)[0].count} inspections, ${(imageCount.rows || imageCount)[0].count} images`);
        
        console.log("✅ Database migration completed successfully!");
        
    } catch (error) {
        console.error("❌ Error during database migration:", error);
        throw error;
    }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateDatabase()
        .then(() => {
            console.log('🎉 Migration completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

export { migrateDatabase };
