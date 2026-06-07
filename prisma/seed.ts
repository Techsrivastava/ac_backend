import { PrismaClient, UserRole, ProductType, BlogStatus, OrderStatus, PaymentStatus, CouponType, HomepageSection } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.media.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.reviewImage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.pincode.deleteMany();
  await prisma.blogImage.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.productFeature.deleteMany();
  await prisma.productSpecification.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@becool.com' },
    update: {},
    create: {
      email: 'superadmin@becool.com',
      password: superAdminPassword,
      name: 'Super Admin',
      role: UserRole.super_admin,
      phone: '+351911750971',
      isActive: true,
    },
  });
  console.log('✅ Super Admin:', superAdmin.email);

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@becool.com' },
    update: {},
    create: {
      email: 'admin@becool.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.admin,
      phone: '+351911750971',
      isActive: true,
    },
  });
  console.log('✅ Admin:', admin.email);

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'air-conditioning' },
      update: {},
      create: {
        name: 'Air Conditioning',
        slug: 'air-conditioning',
        description: 'Split, window, and portable AC units for all room sizes',
        imageUrl: '/images/categories/ac.jpg',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'pool-heat-pumps' },
      update: {},
      create: {
        name: 'Pool Heat Pumps',
        slug: 'pool-heat-pumps',
        description: 'Energy-efficient heating solutions for swimming pools',
        imageUrl: '/images/categories/pool.jpg',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'solar-panels' },
      update: {},
      create: {
        name: 'Solar Panels',
        slug: 'solar-panels',
        description: 'Renewable energy solutions for homes and businesses',
        imageUrl: '/images/categories/solar.jpg',
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'batteries-inverters' },
      update: {},
      create: {
        name: 'Batteries & Inverters',
        slug: 'batteries-inverters',
        description: 'Power storage and backup solutions',
        imageUrl: '/images/categories/battery.jpg',
        sortOrder: 4,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'heating-systems' },
      update: {},
      create: {
        name: 'Heating Systems',
        slug: 'heating-systems',
        description: 'Efficient heating solutions for winter comfort',
        imageUrl: '/images/categories/heating.jpg',
        sortOrder: 5,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'HVAC accessories, parts, and maintenance items',
        imageUrl: '/images/categories/accessories.jpg',
        sortOrder: 6,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Categories:', categories.map(c => c.name).join(', '));

  // Create Sample Products
  const acCategory = categories.find(c => c.slug === 'air-conditioning');
  if (acCategory) {
    const product1 = await prisma.product.upsert({
      where: { sku: 'SAM-AR40-9000' },
      update: {},
      create: {
        name: 'Samsung AR40 R32 Wall Split 9000 Btu/hr Inverter AC',
        slug: 'samsung-ar40-9000-btu-inverter-ac',
        description: 'Samsung AR40 Series with R32 eco-friendly refrigerant. Energy efficient inverter technology with Wi-Fi connectivity. Perfect for small rooms up to 130 sq ft.',
        shortDescription: 'Energy efficient 9000 BTU inverter AC with Wi-Fi control',
        brand: 'Samsung',
        categoryId: acCategory.id,
        price: 499.00,
        discountPrice: 389.00,
        stockQuantity: 35,
        sku: 'SAM-AR40-9000',
        type: ProductType.inverter,
        coolingCapacity: '9000 BTU/hr',
        energyRating: 5,
        warranty: '5 Years',
        installationCharges: 120.00,
        isFeatured: true,
        isActive: true,
        weightKg: 36.50,
        dimensions: 'Indoor: 820x285x210 mm | Outdoor: 720x548x265 mm',
        metaTitle: 'Samsung AR40 9000 BTU Inverter AC | Be Cool Heating',
        metaDescription: 'Buy Samsung AR40 9000 BTU Inverter AC with Wi-Fi control. Energy efficient R32 refrigerant. 5-year warranty.',
      },
    });

    // Add product images
    await prisma.productImage.createMany({
      skipDuplicates: true,
      data: [
        { productId: product1.id, imageUrl: 'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-front-view-250x250.png', altText: 'Samsung AR40 Front View', isPrimary: true, sortOrder: 1 },
        { productId: product1.id, imageUrl: 'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-side-view.png', altText: 'Samsung AR40 Side View', sortOrder: 2 },
        { productId: product1.id, imageUrl: 'https://acdirect.co.za/wp-content/uploads/2025/10/AR40-indoor-unit.png', altText: 'Samsung AR40 Indoor Unit', sortOrder: 3 },
      ],
    });

    // Add product features
    await prisma.productFeature.createMany({
      skipDuplicates: true,
      data: [
        { productId: product1.id, featureText: 'R32 Eco-friendly Refrigerant', sortOrder: 1 },
        { productId: product1.id, featureText: 'Digital Inverter Technology', sortOrder: 2 },
        { productId: product1.id, featureText: 'Wi-Fi Smart Control', sortOrder: 3 },
        { productId: product1.id, featureText: 'Anti-bacterial Filter', sortOrder: 4 },
        { productId: product1.id, featureText: 'Auto Clean Function', sortOrder: 5 },
        { productId: product1.id, featureText: 'Sleep Mode', sortOrder: 6 },
        { productId: product1.id, featureText: 'Turbo Cooling', sortOrder: 7 },
        { productId: product1.id, featureText: 'Stabilizer Free (130-300V)', sortOrder: 8 },
      ],
    });

    // Add specifications
    await prisma.productSpecification.createMany({
      skipDuplicates: true,
      data: [
        { productId: product1.id, specKey: 'Model', specValue: 'AR40R9A', specGroup: 'Technical' },
        { productId: product1.id, specKey: 'Capacity', specValue: '9000 BTU/hr (0.75 Ton)', specGroup: 'Technical' },
        { productId: product1.id, specKey: 'Coverage', specValue: '110-130 sq ft', specGroup: 'Technical' },
        { productId: product1.id, specKey: 'Power Consumption', specValue: '650W', specGroup: 'Technical' },
        { productId: product1.id, specKey: 'Noise Level', specValue: '28 dB(A)', specGroup: 'Technical' },
        { productId: product1.id, specKey: 'Refrigerant', specValue: 'R32', specGroup: 'Technical' },
        { productId: product1.id, specKey: 'Indoor Weight', specValue: '8.5 kg', specGroup: 'Physical' },
        { productId: product1.id, specKey: 'Outdoor Weight', specValue: '28 kg', specGroup: 'Physical' },
      ],
    });

    console.log('✅ Product:', product1.name);
  }

  // Create Sample Blog
  const blog1 = await prisma.blog.upsert({
    where: { slug: 'how-to-choose-right-ac' },
    update: {},
    create: {
      title: 'How to Choose the Right Air Conditioner for Your Home',
      slug: 'how-to-choose-right-ac',
      excerpt: 'Choosing the perfect AC can be overwhelming. Learn about BTU ratings, energy efficiency, and the best brands for your needs.',
      content: `<h2>Understanding BTU Ratings</h2>
<p>BTU (British Thermal Unit) measures the cooling capacity of an AC unit. A higher BTU rating means more cooling power, but bigger isn't always better.</p>

<h3>Room Size Guide:</h3>
<ul>
<li><strong>100-150 sq ft:</strong> 5,000-6,000 BTU</li>
<li><strong>150-250 sq ft:</strong> 6,000-8,000 BTU</li>
<li><strong>250-350 sq ft:</strong> 8,000-10,000 BTU</li>
<li><strong>350-450 sq ft:</strong> 10,000-12,000 BTU</li>
<li><strong>450-550 sq ft:</strong> 12,000-14,000 BTU</li>
</ul>

<h2>Energy Efficiency Ratings</h2>
<p>Look for units with high EER (Energy Efficiency Ratio) or SEER (Seasonal Energy Efficiency Ratio) ratings. Inverter technology can save up to 40% on electricity bills compared to conventional ACs.</p>

<h2>Top Brands in Portugal</h2>
<p>At Be Cool Heating, we recommend Samsung, LG, Daikin, and Midea for their reliability, energy efficiency, and excellent after-sales service.</p>`,
      featuredImageUrl: '/images/blogs/ac-buying-guide.jpg',
      authorId: admin.id,
      category: 'Buying Guide',
      tags: ['AC Tips', 'Buying Guide', 'Energy Saving'],
      status: BlogStatus.published,
      isFeatured: true,
      viewCount: 1250,
      metaTitle: 'How to Choose the Right AC | Be Cool Heating Guide',
      metaDescription: 'Expert guide on choosing the perfect air conditioner. Learn about BTU ratings, energy efficiency, and top brands in Portugal.',
      publishedAt: new Date(),
    },
  });
  console.log('✅ Blog:', blog1.title);

  // Create Site Settings
  const siteSettings = [
    { key: 'site_name', value: 'Be Cool Heating', type: 'string', group: 'general', label: 'Site Name' },
    { key: 'site_logo', value: '/logo.svg', type: 'image', group: 'general', label: 'Site Logo' },
    { key: 'site_favicon', value: '/favicon.ico', type: 'image', group: 'general', label: 'Favicon' },
    { key: 'contact_phone', value: '+351 911 750 971', type: 'string', group: 'contact', label: 'Phone Number' },
    { key: 'contact_email', value: 'Eurocooling@aol.com', type: 'string', group: 'contact', label: 'Email' },
    { key: 'contact_address', value: 'Algarve, Portugal', type: 'string', group: 'contact', label: 'Address' },
    { key: 'whatsapp_number', value: '+351911750971', type: 'string', group: 'contact', label: 'WhatsApp Number' },
    { key: 'facebook_url', value: 'https://facebook.com/becoolheating', type: 'string', group: 'social', label: 'Facebook URL' },
    { key: 'instagram_url', value: 'https://instagram.com/becoolheating', type: 'string', group: 'social', label: 'Instagram URL' },
    { key: 'meta_title', value: 'Be Cool Heating | HVAC Solutions in Portugal', type: 'string', group: 'seo', label: 'Default Meta Title' },
    { key: 'meta_description', value: 'Your trusted partner for air conditioning, heating, solar panels, and pool heat pumps in Portugal. 20+ years experience.', type: 'string', group: 'seo', label: 'Default Meta Description' },
    { key: 'stats_years', value: '20+', type: 'string', group: 'homepage', label: 'Years Experience Stat' },
    { key: 'stats_customers', value: '30K+', type: 'string', group: 'homepage', label: 'Happy Customers Stat' },
    { key: 'stats_technicians', value: '60+', type: 'string', group: 'homepage', label: 'Expert Technicians Stat' },
    { key: 'stats_support', value: '24/7', type: 'string', group: 'homepage', label: 'Support Available Stat' },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ Site Settings:', siteSettings.length);

  // Create Homepage Sections
  const heroSection = await prisma.homepageSection.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      sectionType: 'hero',
      title: 'Premium HVAC Solutions',
      subtitle: 'Air Conditioning, Heating, Solar & Pool Systems',
      content: { cta_text: 'Shop Now', cta_link: '/products' },
      images: ['/images/Hero 01.png', '/images/Hero 02.png', '/images/Hero 03.png'],
      sortOrder: 1,
      isActive: true,
      settings: { height: '600px', overlay: true, autoplay: true },
    },
  });

  const categoriesSection = await prisma.homepageSection.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      sectionType: 'categories',
      title: 'Our Services',
      subtitle: 'Complete climate control solutions for your home and business',
      content: { show_count: true },
      sortOrder: 2,
      isActive: true,
    },
  });

  const featuredProductsSection = await prisma.homepageSection.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      sectionType: 'products',
      title: 'Featured Products',
      subtitle: 'Best-selling HVAC solutions handpicked for you',
      content: { source: 'featured', limit: 8 },
      sortOrder: 3,
      isActive: true,
    },
  });

  const brandsSection = await prisma.homepageSection.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      sectionType: 'brands',
      title: 'Trusted Brands',
      subtitle: 'We partner with industry-leading manufacturers',
      content: {},
      images: ['/brandlogos/samsung.png', '/brandlogos/lg.png', '/brandlogos/daikin.png', '/brandlogos/midea.png'],
      sortOrder: 4,
      isActive: true,
    },
  });

  console.log('✅ Homepage Sections:', 4);

  // Create Menu
  await prisma.menu.upsert({
    where: { name: 'primary' },
    update: {},
    create: {
      name: 'primary',
      items: [
        { label: 'Home', url: '/', children: [] },
        { label: 'Products', url: '/products', children: [
          { label: 'Air Conditioning', url: '/products?category=air-conditioning' },
          { label: 'Pool Heat Pumps', url: '/products?category=pool-heat-pumps' },
          { label: 'Solar Panels', url: '/products?category=solar-panels' },
          { label: 'Heating Systems', url: '/products?category=heating-systems' },
        ]},
        { label: 'Services', url: '/services', children: [] },
        { label: 'Blog', url: '/blog', children: [] },
        { label: 'About', url: '/about', children: [] },
        { label: 'Contact', url: '/contact', children: [] },
      ],
    },
  });
  console.log('✅ Primary Menu');

  // Create Pincodes (Serviceable Areas)
  const pincodes = [
    { pincode: '8000', city: 'Faro', state: 'Algarve', deliveryDays: 1 },
    { pincode: '8100', city: 'Loulé', state: 'Algarve', deliveryDays: 1 },
    { pincode: '8200', city: 'Albufeira', state: 'Algarve', deliveryDays: 1 },
    { pincode: '8300', city: 'Silves', state: 'Algarve', deliveryDays: 2 },
    { pincode: '8400', city: 'Lagoa', state: 'Algarve', deliveryDays: 1 },
    { pincode: '8500', city: 'Portimão', state: 'Algarve', deliveryDays: 1 },
    { pincode: '8600', city: 'Lagos', state: 'Algarve', deliveryDays: 2 },
    { pincode: '8700', city: 'Vila Real', state: 'Algarve', deliveryDays: 2 },
    { pincode: '8800', city: 'Tavira', state: 'Algarve', deliveryDays: 2 },
  ];

  for (const pin of pincodes) {
    await prisma.pincode.upsert({
      where: { pincode: pin.pincode },
      update: {},
      create: { ...pin, isServiceable: true, shippingCharge: 0 },
    });
  }
  console.log('✅ Pincodes:', pincodes.length);

  console.log('\n✨ Database seed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Super Admin: superadmin@becool.com / superadmin123');
  console.log('  Admin:       admin@becool.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
