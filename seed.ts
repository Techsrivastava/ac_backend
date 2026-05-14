import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';
import Category from './models/Category';
import Product from './models/Product';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://adarshsrivastavawork_db_user:cePbYCiRobld5qhP@cluster0.jqpxp1k.mongodb.net/?appName=Cluster0');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create super admin users (matching the login page credentials)
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    const superAdmin = new User({
      email: 'superadmin@becool.com',
      password: superAdminPassword,
      name: 'Super Admin',
      role: 'super_admin'
    });
    await superAdmin.save();
    console.log('Super admin created: superadmin@becool.com');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      email: 'admin@becool.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin'
    });
    await admin.save();
    console.log('Admin created: admin@becool.com');

    // Create categories
    const categories = [
      { name: 'Air Conditioners', description: 'Cooling solutions for your home' },
      { name: 'Heating Systems', description: 'Heating solutions for winter' },
      { name: 'Solar Panels', description: 'Renewable energy solutions' },
      { name: 'Accessories', description: 'HVAC accessories and parts' }
    ];
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories created');

    // Create products from real CSV data (acdirect.co.za)
    const products = [
      {
        name: 'Samsung AR40 R32 Wall Split 9000 Btu/hr Inverter AC',
        brand: 'Samsung',
        description: 'Samsung AR40 Series with R32 eco-friendly refrigerant. Energy efficient inverter technology with Wi-Fi connectivity. Perfect for small rooms up to 130 sq ft.',
        price: 499,
        discountPrice: 389,
        category: createdCategories[0]._id,
        images: [
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-front-view-250x250.png',
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-side-view.png',
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-indoor-unit.png',
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-outdoor-unit.png'
        ],
        stock: 35,
        featured: true,
        coolingCapacity: '9000 BTU/hr',
        energyRating: 5,
        warranty: '5 Years',
        installationCharges: 120,
        type: 'inverter',
        datasheet: {
          model: 'AR40R9A',
          capacity: '9000 BTU/hr (0.75 Ton)',
          coverage: '110-130 sq ft',
          powerConsumption: '650W',
          noiseLevel: '28 dB(A)',
          refrigerant: 'R32',
          compressor: 'Digital Inverter',
          dimensions: 'Indoor: 820x285x210 mm | Outdoor: 720x548x265 mm',
          weight: 'Indoor: 8.5 kg | Outdoor: 28 kg',
          features: [
            'R32 Eco-friendly Refrigerant',
            'Digital Inverter Technology',
            'Wi-Fi Smart Control',
            'Anti-bacterial Filter',
            'Auto Clean Function',
            'Sleep Mode',
            'Turbo Cooling',
            'Stabilizer Free (130-300V)'
          ]
        }
      },
      {
        name: 'Samsung AR40 R32 Wall Split 24000 Btu/hr Inverter AC',
        brand: 'Samsung',
        description: 'High capacity Samsung AR40 for large spaces. 24000 BTU cooling power with energy saving inverter technology. Ideal for halls and large living rooms.',
        price: 1099,
        discountPrice: 849,
        category: createdCategories[0]._id,
        images: [
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-front-view-250x250.png',
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-24000-specs.png',
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-remote-control.png'
        ],
        stock: 20,
        featured: true,
        coolingCapacity: '24000 BTU/hr',
        energyRating: 3,
        warranty: '5 Years',
        installationCharges: 250,
        type: 'inverter',
        datasheet: {
          model: 'AR40R24A',
          capacity: '24000 BTU/hr (2 Ton)',
          coverage: '200-280 sq ft',
          powerConsumption: '1850W',
          noiseLevel: '36 dB(A)',
          refrigerant: 'R32',
          compressor: 'High Capacity Inverter',
          dimensions: 'Indoor: 1050x325x245 mm | Outdoor: 950x700x330 mm',
          weight: 'Indoor: 14 kg | Outdoor: 45 kg',
          features: [
            'High Capacity 24000 BTU',
            'R32 Refrigerant',
            'Smart Inverter Technology',
            'Anti-corrosion Coating',
            'Multi-flow Cooling',
            'Auto Restart',
            'Sleep Mode',
            'Low Voltage Start'
          ]
        }
      },
      {
        name: 'Samsung AR80 Wind Free Wi-Fi Wall Split 18000 Btu/hr Inverter AC',
        brand: 'Samsung',
        description: 'Premium Wind-Free technology with 23000 micro holes for gentle cooling. No direct cold air draft. Wi-Fi enabled with SmartThings app control.',
        price: 1399,
        discountPrice: 1109,
        category: createdCategories[0]._id,
        images: [
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR80-front-view-250x250.png',
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR80-windfree-tech.png',
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR80-wifi-smart.png',
          'https://acdirect.co.za/wp-content/uploads/2025/10/AR80-installation.png'
        ],
        stock: 15,
        featured: true,
        coolingCapacity: '18000 BTU/hr',
        energyRating: 5,
        warranty: '10 Years Compressor',
        installationCharges: 200,
        type: 'inverter',
        datasheet: {
          model: 'AR80R18A',
          capacity: '18000 BTU/hr (1.5 Ton)',
          coverage: '170-200 sq ft',
          powerConsumption: '1450W',
          noiseLevel: '24 dB(A)',
          refrigerant: 'R32',
          compressor: 'Wind-Free Inverter',
          dimensions: 'Indoor: 950x310x220 mm | Outdoor: 880x650x310 mm',
          weight: 'Indoor: 12 kg | Outdoor: 38 kg',
          features: [
            'Wind-Free Cooling Technology',
            '23000 Micro Air Holes',
            'Wi-Fi Smart Control',
            'AI Auto Cooling',
            '5-in-1 Convertible',
            'Triple Protection Plus',
            'Copper Condenser',
            'SmartThings Compatible'
          ]
        }
      },
      {
        name: 'LG Dual Cool Pro Wall Split 12000 Btu/hr Non Inverter AC',
        brand: 'LG',
        description: 'Reliable non-inverter AC with Dual Cool technology. Fast cooling with gold fin anti-corrosion coating. Budget-friendly option for medium rooms.',
        price: 449,
        discountPrice: 339,
        category: createdCategories[0]._id,
        images: ['https://acdirect.co.za/wp-content/uploads/2025/12/LG_non-inverter-front-250x250.png'],
        stock: 40,
        featured: false,
        coolingCapacity: '12000 BTU/hr',
        energyRating: 3,
        warranty: '5 Years Compressor',
        installationCharges: 140,
        type: 'split',
        datasheet: {
          model: 'LS-H12V2A',
          capacity: '12000 BTU/hr (1 Ton)',
          coverage: '140-160 sq ft',
          powerConsumption: '1150W',
          noiseLevel: '32 dB(A)',
          refrigerant: 'R410A',
          compressor: 'Rotary Compressor',
          dimensions: 'Indoor: 870x300x210 mm | Outdoor: 780x550x280 mm',
          weight: 'Indoor: 9 kg | Outdoor: 30 kg',
          features: [
            'Dual Cool Technology',
            'Gold Fin Anti-corrosion',
            'Fast Cooling Mode',
            'Auto Swing',
            'Sleep Mode',
            'Timer Function',
            'Auto Restart',
            'Washable Filter'
          ]
        }
      },
      {
        name: 'LG Dual Cool + Inverter Wall Split 9000 Btu/hr Inverter AC',
        brand: 'LG',
        description: 'AI DUAL Inverter with Wi-Fi control. Energy efficient with 6-in-1 convertible modes. Ocean Black Protection for coastal areas.',
        price: 779,
        discountPrice: 439,
        category: createdCategories[0]._id,
        images: ['https://acdirect.co.za/wp-content/uploads/2025/05/LG-Dual-Cool-Front-View-250x250.jpg'],
        stock: 30,
        featured: true,
        coolingCapacity: '9000 BTU/hr',
        energyRating: 5,
        warranty: '10 Years Compressor',
        installationCharges: 130,
        type: 'inverter',
        datasheet: {
          model: 'RS-Q09VNXE',
          capacity: '9000 BTU/hr (0.75 Ton)',
          coverage: '110-130 sq ft',
          powerConsumption: '620W',
          noiseLevel: '19 dB(A)',
          refrigerant: 'R32',
          compressor: 'AI DUAL Inverter',
          dimensions: 'Indoor: 837x308x189 mm | Outdoor: 770x545x288 mm',
          weight: 'Indoor: 8.5 kg | Outdoor: 28 kg',
          features: [
            'AI DUAL Inverter',
            'Wi-Fi Smart Control',
            '6-in-1 Convertible Modes',
            'Ocean Black Protection',
            'Anti-Virus Filter',
            'Magic Display',
            'Stabilizer Free (120-290V)',
            'Hi-Grooved Copper'
          ]
        }
      },
      {
        name: 'LG Dual Cool + Inverter Wall Split 12000 Btu/hr Inverter AC',
        brand: 'LG',
        description: 'Popular 1 Ton inverter model with Wi-Fi and voice control. PM 1.0 filter for clean air. Smart diagnosis feature.',
        price: 829,
        discountPrice: 459,
        category: createdCategories[0]._id,
        images: ['https://acdirect.co.za/wp-content/uploads/2025/05/LG-Dual-Cool-Front-View-250x250.jpg'],
        stock: 45,
        featured: true,
        coolingCapacity: '12000 BTU/hr',
        energyRating: 5,
        warranty: '10 Years Compressor',
        installationCharges: 150,
        type: 'inverter',
        datasheet: {
          model: 'RS-Q12VNXE',
          capacity: '12000 BTU/hr (1 Ton)',
          coverage: '140-160 sq ft',
          powerConsumption: '780W',
          noiseLevel: '22 dB(A)',
          refrigerant: 'R32',
          compressor: 'AI DUAL Inverter',
          dimensions: 'Indoor: 837x308x189 mm | Outdoor: 770x545x288 mm',
          weight: 'Indoor: 8.5 kg | Outdoor: 28 kg',
          features: [
            'AI DUAL Inverter',
            'Wi-Fi & Voice Control',
            'PM 1.0 Smart Filter',
            '6-in-1 Convertible',
            'Ocean Black Protection',
            'Smart Diagnosis',
            'Magic Display',
            '100% Copper'
          ]
        }
      },
      {
        name: 'Daikin Sensira R32 Wall Split 9000 Btu/hr Inverter AC',
        brand: 'Daikin',
        description: 'Premium Sensira series with Coanda Airflow for uniform cooling. PM 2.5 filter included. Wi-Fi ready with optional adapter.',
        price: 649,
        discountPrice: 499,
        category: createdCategories[0]._id,
        images: ['https://acdirect.co.za/wp-content/uploads/2025/05/Daikin-Sensira_front-view-250x250.jpg'],
        stock: 25,
        featured: true,
        coolingCapacity: '9000 BTU/hr',
        energyRating: 5,
        warranty: '10 Years Compressor',
        installationCharges: 160,
        type: 'inverter',
        datasheet: {
          model: 'FTKM25U',
          capacity: '9000 BTU/hr (0.75 Ton)',
          coverage: '110-130 sq ft',
          powerConsumption: '580W',
          noiseLevel: '25 dB(A)',
          refrigerant: 'R32',
          compressor: 'Swing Inverter',
          dimensions: 'Indoor: 770x295x240 mm | Outdoor: 745x595x300 mm',
          weight: 'Indoor: 9 kg | Outdoor: 32 kg',
          features: [
            'Coanda Airflow Technology',
            'PM 2.5 Filter Included',
            'Wi-Fi Ready',
            '3D Airflow',
            'Neo Swing Compressor',
            'Econo Mode',
            'Self Diagnosis',
            'Copper Condenser'
          ]
        }
      },
      {
        name: 'Daikin Sensira R32 Wall Split 12000 Btu/hr Inverter AC',
        brand: 'Daikin',
        description: 'Best-selling 1 Ton Sensira with advanced features. Intelligent Eye sensor detects human presence. Econo mode for energy savings.',
        price: 699,
        discountPrice: 549,
        category: createdCategories[0]._id,
        images: ['https://acdirect.co.za/wp-content/uploads/2025/05/Daikin-Sensira_front-view-250x250.jpg'],
        stock: 35,
        featured: true,
        coolingCapacity: '12000 BTU/hr',
        energyRating: 5,
        warranty: '10 Years Compressor',
        installationCharges: 180,
        type: 'inverter',
        datasheet: {
          model: 'FTKM35U',
          capacity: '12000 BTU/hr (1 Ton)',
          coverage: '140-160 sq ft',
          powerConsumption: '750W',
          noiseLevel: '26 dB(A)',
          refrigerant: 'R32',
          compressor: 'Swing Inverter',
          dimensions: 'Indoor: 880x295x240 mm | Outdoor: 845x595x300 mm',
          weight: 'Indoor: 10 kg | Outdoor: 35 kg',
          features: [
            'Coanda Airflow',
            'Intelligent Eye Sensor',
            'PM 2.5 Filter',
            '3D Airflow Control',
            'Neo Swing Compressor',
            'Econo Mode',
            'Self Diagnosis',
            '100% Copper'
          ]
        }
      },
      {
        name: 'Midea Breezeless E R32 Wall Split 9000 Btu/hr Inverter AC',
        brand: 'Midea',
        description: 'Breezeless technology eliminates direct cold draft. Perfect for bedrooms and baby rooms. Wi-Fi enabled with smartphone control.',
        price: 549,
        discountPrice: 549,
        category: createdCategories[0]._id,
        images: ['https://acdirect.co.za/wp-content/uploads/2025/05/New-Midea-Breezeless-E-Unit-Image-Front-Closed-Image-250x250.jpg'],
        stock: 30,
        featured: false,
        coolingCapacity: '9000 BTU/hr',
        energyRating: 5,
        warranty: '5 Years Compressor, 2 Years PCB',
        installationCharges: 120,
        type: 'inverter',
        datasheet: {
          model: 'MSAGT-09HRFN8',
          capacity: '9000 BTU/hr (0.75 Ton)',
          coverage: '110-130 sq ft',
          powerConsumption: '650W',
          noiseLevel: '21 dB(A)',
          refrigerant: 'R32',
          compressor: 'Inverter Quattro',
          dimensions: 'Indoor: 835x295x215 mm | Outdoor: 765x555x303 mm',
          weight: 'Indoor: 9.5 kg | Outdoor: 30 kg',
          features: [
            'Breezeless Technology',
            'No Cold Draft',
            'Wi-Fi Smart Control',
            '7-step Fan Speed',
            'Sleep Mode',
            'Turbo Mode',
            'Self Clean',
            'Gold Fin Protection'
          ]
        }
      },
      {
        name: 'Midea Breezeless E R32 Wall Split 12000 Btu/hr Inverter AC',
        brand: 'Midea',
        description: '1 Ton Breezeless model with advanced comfort features. 7928 micro holes distribute cool air gently. Anti-bacterial filter.',
        price: 769,
        discountPrice: 499,
        category: createdCategories[0]._id,
        images: ['https://acdirect.co.za/wp-content/uploads/2025/05/New-Midea-Breezeless-E-Unit-Image-Front-Closed-Image-250x250.jpg'],
        stock: 25,
        featured: false,
        coolingCapacity: '12000 BTU/hr',
        energyRating: 5,
        warranty: '5 Years Compressor, 2 Years PCB',
        installationCharges: 140,
        type: 'inverter',
        datasheet: {
          model: 'MSAGT-12HRFN8',
          capacity: '12000 BTU/hr (1 Ton)',
          coverage: '140-160 sq ft',
          powerConsumption: '850W',
          noiseLevel: '22 dB(A)',
          refrigerant: 'R32',
          compressor: 'Inverter Quattro',
          dimensions: 'Indoor: 835x295x215 mm | Outdoor: 765x555x303 mm',
          weight: 'Indoor: 10 kg | Outdoor: 32 kg',
          features: [
            'Breezeless Technology',
            '7928 Micro Holes',
            'Wi-Fi Control',
            'Anti-bacterial Filter',
            '7-step Fan Speed',
            'Sleep Mode',
            'Self Clean',
            'Follow Me Sensor'
          ]
        }
      },
      {
        name: 'Alliance Smart Aqua R32 Swimming Pool Heat Pump 12kW Inverter',
        brand: 'Alliance',
        description: 'Smart pool heating solution with R32 refrigerant. Wi-Fi enabled for remote control. Energy efficient inverter technology for year-round pool comfort.',
        price: 999,
        discountPrice: 899,
        category: createdCategories[1]._id,
        images: ['https://acdirect.co.za/wp-content/uploads/2025/05/Alliance-Smart-Aqua-R32-Swimming-Pool-Heat-Pump-Image-250x250.jpg'],
        stock: 12,
        featured: false,
        coolingCapacity: '40000 BTU/hr',
        energyRating: 4,
        warranty: '3 Years',
        installationCharges: 400,
        type: 'accessories',
        datasheet: {
          model: 'AQUA-12R32',
          capacity: '12kW Heating',
          coverage: '30,000-50,000L Pools',
          powerConsumption: '2800W',
          noiseLevel: '48 dB(A)',
          refrigerant: 'R32',
          compressor: 'Twin Rotary Inverter',
          dimensions: 'Unit: 1000x420x710 mm',
          weight: '65 kg',
          features: [
            'Wi-Fi Smart Control',
            'R32 Eco Refrigerant',
            'Inverter Technology',
            'Titanium Heat Exchanger',
            'Year-round Heating',
            'Defrost Function',
            'Digital Display',
            'Anti-freeze Protection'
          ]
        }
      },
      {
        name: 'Alliance Smart Aqua R32 Swimming Pool Heat Pump 18kW Inverter',
        brand: 'Alliance',
        description: 'High capacity 18kW pool heat pump for large pools. Smart Wi-Fi control via app. Inverter technology saves up to 70% energy compared to gas heaters.',
        price: 1999,
        discountPrice: 1229,
        category: createdCategories[1]._id,
        images: ['https://acdirect.co.za/wp-content/uploads/2025/05/Alliance-Smart-Aqua-R32-Swimming-Pool-Heat-Pump-Image-250x250.jpg'],
        stock: 8,
        featured: true,
        coolingCapacity: '60000 BTU/hr',
        energyRating: 4,
        warranty: '3 Years',
        installationCharges: 500,
        type: 'accessories',
        datasheet: {
          model: 'AQUA-18R32',
          capacity: '18kW Heating',
          coverage: '50,000-80,000L Pools',
          powerConsumption: '4200W',
          noiseLevel: '52 dB(A)',
          refrigerant: 'R32',
          compressor: 'Twin Rotary Inverter',
          dimensions: 'Unit: 1100x450x780 mm',
          weight: '85 kg',
          features: [
            'High Capacity 18kW',
            'Wi-Fi Smart Control',
            'R32 Refrigerant',
            '70% Energy Savings',
            'Titanium Heat Exchanger',
            'All Season Operation',
            'Smart Defrost',
            'LED Display Panel'
          ]
        }
      }
    ];
    await Product.insertMany(products);
    console.log('Products created');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
