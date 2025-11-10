import { DataSource } from 'typeorm';
import { Customer } from '../order/entities/customer.entity';
import { Product } from '../order/entities/product.entity';
import { Location } from '../order/entities/location.entity';

export async function seedDatabase(dataSource: DataSource) {
  console.log('Seeding database...');

  // Seed Locations
  const locationRepository = dataSource.getRepository(Location);
  const locations = [
    {
      name: 'Downtown Store',
      address: '123 Main St',
      city: 'New York',
      country: 'US',
      zipCode: '10001',
      latitude: 40.7128,
      longitude: -74.0060,
    },
    {
      name: 'Mall Location',
      address: '456 Mall Ave',
      city: 'Toronto',
      country: 'CA',
      zipCode: 'M5V 3A8',
      latitude: 43.6532,
      longitude: -79.3832,
    },
    {
      name: 'Airport Branch',
      address: '789 Airport Rd',
      city: 'Los Angeles',
      country: 'US',
      zipCode: '90045',
      latitude: 33.9425,
      longitude: -118.4081,
    },
  ];

  for (const locationData of locations) {
    const location = locationRepository.create(locationData);
    await locationRepository.save(location);
  }

  // Seed Customers
  const customerRepository = dataSource.getRepository(Customer);
  const customers = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '+1-555-0101',
      address: '123 Customer St, New York, NY 10001',
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@email.com',
      phone: '+1-555-0102',
      address: '456 Buyer Ave, Toronto, ON M5V 1A1',
    },
    {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@email.com',
      phone: '+1-555-0103',
      address: '789 Client Rd, Los Angeles, CA 90210',
    },
    {
      firstName: 'Alice',
      lastName: 'Williams',
      email: 'alice.williams@email.com',
      phone: '+1-555-0104',
      address: '321 Patron Blvd, Chicago, IL 60601',
    },
    {
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie.brown@email.com',
      phone: '+1-555-0105',
      address: '654 Shopper St, Miami, FL 33101',
    },
  ];

  for (const customerData of customers) {
    const customer = customerRepository.create(customerData);
    await customerRepository.save(customer);
  }

  // Seed Products
  const productRepository = dataSource.getRepository(Product);
  const products = [
    {
      name: 'Laptop Pro',
      description: 'High-performance laptop for professionals',
      price: 1299.99,
      stockQuantity: 50,
      category: 'Electronics',
    },
    {
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones',
      price: 299.99,
      stockQuantity: 100,
      category: 'Electronics',
    },
    {
      name: 'Coffee Maker',
      description: 'Automatic drip coffee maker with timer',
      price: 89.99,
      stockQuantity: 75,
      category: 'Home & Kitchen',
    },
    {
      name: 'Running Shoes',
      description: 'Comfortable running shoes for daily training',
      price: 129.99,
      stockQuantity: 200,
      category: 'Sports',
    },
    {
      name: 'Desk Chair',
      description: 'Ergonomic office chair with lumbar support',
      price: 249.99,
      stockQuantity: 30,
      category: 'Furniture',
    },
    {
      name: 'Smartphone',
      description: 'Latest model smartphone with advanced features',
      price: 799.99,
      stockQuantity: 80,
      category: 'Electronics',
    },
    {
      name: 'Water Bottle',
      description: 'Insulated stainless steel water bottle',
      price: 24.99,
      stockQuantity: 150,
      category: 'Sports',
    },
    {
      name: 'Backpack',
      description: 'Durable travel backpack with multiple compartments',
      price: 79.99,
      stockQuantity: 60,
      category: 'Travel',
    },
  ];

  for (const productData of products) {
    const product = productRepository.create(productData);
    await productRepository.save(product);
  }

  console.log('Database seeded successfully!');
}