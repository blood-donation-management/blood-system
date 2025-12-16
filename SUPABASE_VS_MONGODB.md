# Supabase vs MongoDB: Code Comparison

## 📊 Side-by-Side Query Comparison

### 1. CREATE (Insert)

#### MongoDB (Mongoose)
```javascript
// Create a donor
const donor = new Donor({
  name: 'John Doe',
  email: 'john@example.com',
  password: hashedPassword,
  bloodGroup: 'A+',
  location: 'Dhaka',
  phoneNumber: '01712345678'
});
await donor.save();

// Or using create()
const donor = await Donor.create({
  name: 'John Doe',
  email: 'john@example.com',
  // ...
});
```

#### Supabase
```javascript
// Create a donor
const { data: donor, error } = await supabase
  .from('donors')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    password: hashedPassword,
    blood_group: 'A+',  // snake_case!
    location: 'Dhaka',
    phone_number: '01712345678'  // snake_case!
  })
  .select()
  .single();
```

---

### 2. READ (Find One)

#### MongoDB
```javascript
// Find by email
const donor = await Donor.findOne({ email: 'john@example.com' });

// Find by ID
const donor = await Donor.findById(donorId);

// With select (exclude fields)
const donor = await Donor.findById(donorId).select('-password');
```

#### Supabase
```javascript
// Find by email
const { data: donor, error } = await supabase
  .from('donors')
  .select('*')
  .eq('email', 'john@example.com')
  .single();

// Find by ID
const { data: donor, error } = await supabase
  .from('donors')
  .select('*')
  .eq('id', donorId)
  .single();

// Exclude password field
const { data: donor, error } = await supabase
  .from('donors')
  .select('id, name, email, blood_group, location, phone_number')
  .eq('id', donorId)
  .single();
```

---

### 3. READ (Find Many)

#### MongoDB
```javascript
// Find all active donors
const donors = await Donor.find({ status: 'active' });

// Find with multiple conditions
const donors = await Donor.find({
  bloodGroup: 'A+',
  location: { $regex: 'Dhaka', $options: 'i' }
});

// With sorting and limit
const donors = await Donor.find({ status: 'active' })
  .sort({ createdAt: -1 })
  .limit(20);
```

#### Supabase
```javascript
// Find all active donors
const { data: donors, error } = await supabase
  .from('donors')
  .select('*')
  .eq('status', 'active');

// Find with multiple conditions
const { data: donors, error } = await supabase
  .from('donors')
  .select('*')
  .eq('blood_group', 'A+')
  .ilike('location', '%Dhaka%');

// With sorting and limit
const { data: donors, error } = await supabase
  .from('donors')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(20);
```

---

### 4. UPDATE

#### MongoDB
```javascript
// Update by ID
const updatedDonor = await Donor.findByIdAndUpdate(
  donorId,
  { verified: true, verificationNote: 'Verified' },
  { new: true }  // Return updated document
);

// Update with instance
donor.verified = true;
await donor.save();

// Update many
await Donor.updateMany(
  { status: 'pending' },
  { status: 'active' }
);
```

#### Supabase
```javascript
// Update by ID
const { data: updatedDonor, error } = await supabase
  .from('donors')
  .update({ 
    verified: true, 
    verification_note: 'Verified'  // snake_case!
  })
  .eq('id', donorId)
  .select()
  .single();

// Update many (same syntax)
const { data, error } = await supabase
  .from('donors')
  .update({ status: 'active' })
  .eq('status', 'pending');
```

---

### 5. DELETE

#### MongoDB
```javascript
// Delete by ID
const deletedDonor = await Donor.findByIdAndDelete(donorId);

// Delete many
await Donor.deleteMany({ status: 'suspended' });
```

#### Supabase
```javascript
// Delete by ID
const { error } = await supabase
  .from('donors')
  .delete()
  .eq('id', donorId);

// Delete many
const { error } = await supabase
  .from('donors')
  .delete()
  .eq('status', 'suspended');
```

---

### 6. Complex Queries

#### MongoDB
```javascript
// Find with OR condition
const donors = await Donor.find({
  $or: [
    { requesterId: myId },
    { donorId: myId }
  ]
});

// Find with IN operator
const requests = await BloodRequest.find({
  status: { $in: ['pending', 'accepted'] }
});

// Count documents
const count = await Donor.countDocuments({ status: 'active' });

// Pagination
const page = 2;
const limit = 20;
const skip = (page - 1) * limit;
const donors = await Donor.find()
  .skip(skip)
  .limit(limit);
```

#### Supabase
```javascript
// Find with OR condition
const { data: donors, error } = await supabase
  .from('donors')
  .select('*')
  .or(`requester_id.eq.${myId},donor_id.eq.${myId}`);

// Find with IN operator
const { data: requests, error } = await supabase
  .from('blood_requests')
  .select('*')
  .in('status', ['pending', 'accepted']);

// Count (with exact count)
const { count, error } = await supabase
  .from('donors')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active');

// Pagination
const page = 2;
const limit = 20;
const offset = (page - 1) * limit;
const { data: donors, error, count } = await supabase
  .from('donors')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1);
```

---

### 7. Aggregation

#### MongoDB
```javascript
// Average rating per donor
const ratingAgg = await BloodRequest.aggregate([
  { 
    $match: { 
      donorId: { $in: donorIds }, 
      status: 'completed', 
      rating: { $gte: 1 } 
    } 
  },
  { 
    $group: { 
      _id: '$donorId', 
      avgRating: { $avg: '$rating' }, 
      ratingCount: { $sum: 1 } 
    } 
  }
]);

// Group by blood group
const groups = await Donor.aggregate([
  { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);
```

#### Supabase
```javascript
// Average rating per donor
// Note: Supabase doesn't have built-in aggregation like MongoDB
// You need to do it in application code or use PostgreSQL functions

// Fetch all ratings
const { data: requests } = await supabase
  .from('blood_requests')
  .select('donor_id, rating')
  .in('donor_id', donorIds)
  .eq('status', 'completed')
  .gte('rating', 1);

// Calculate in JS
const ratingMap = new Map();
requests.forEach(r => {
  if (!ratingMap.has(r.donor_id)) {
    ratingMap.set(r.donor_id, { sum: 0, count: 0 });
  }
  const stats = ratingMap.get(r.donor_id);
  stats.sum += r.rating;
  stats.count += 1;
});

// Group by blood group (fetch all, group in JS)
const { data: groups } = await supabase
  .from('donors')
  .select('blood_group');

const donorsByBloodGroup = {};
groups.forEach(g => {
  donorsByBloodGroup[g.blood_group] = (donorsByBloodGroup[g.blood_group] || 0) + 1;
});

// Or use PostgreSQL views/functions for complex aggregations
```

---

### 8. Full-Text Search

#### MongoDB
```javascript
// Regex search (case-insensitive)
const donors = await Donor.find({
  $or: [
    { name: { $regex: query, $options: 'i' } },
    { email: { $regex: query, $options: 'i' } },
    { phoneNumber: { $regex: query, $options: 'i' } }
  ]
});
```

#### Supabase
```javascript
// Case-insensitive search
const { data: donors, error } = await supabase
  .from('donors')
  .select('*')
  .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`);

// Or separate queries
const { data: donors, error } = await supabase
  .from('donors')
  .select('*')
  .ilike('name', `%${query}%`);
```

---

## 🔑 Key Differences

| Feature | MongoDB | Supabase |
|---------|---------|----------|
| **Query Style** | Chainable methods | Fluent API |
| **Field Names** | camelCase | snake_case |
| **IDs** | ObjectID (12 bytes) | UUID (16 bytes) |
| **Error Handling** | try/catch | Check `error` object |
| **Relations** | Manual populate | Foreign keys |
| **Transactions** | Multi-document | Native ACID |
| **Aggregation** | Aggregation pipeline | SQL/JS |
| **Real-time** | Change streams | Built-in subscriptions |

---

## 🎯 Operators Mapping

| Operation | MongoDB | Supabase |
|-----------|---------|----------|
| Equals | `{ field: value }` | `.eq('field', value)` |
| Not equals | `{ field: { $ne: value } }` | `.neq('field', value)` |
| Greater than | `{ field: { $gt: value } }` | `.gt('field', value)` |
| Greater or equal | `{ field: { $gte: value } }` | `.gte('field', value)` |
| Less than | `{ field: { $lt: value } }` | `.lt('field', value)` |
| Less or equal | `{ field: { $lte: value } }` | `.lte('field', value)` |
| IN | `{ field: { $in: [1, 2] } }` | `.in('field', [1, 2])` |
| LIKE | `{ field: { $regex: 'pattern', $options: 'i' } }` | `.ilike('field', '%pattern%')` |
| OR | `{ $or: [{...}, {...}] }` | `.or('field1.eq.val1,field2.eq.val2')` |
| AND | `{ field1: val1, field2: val2 }` | `.eq('field1', val1).eq('field2', val2)` |

---

## 💡 Best Practices

### MongoDB
```javascript
// Use lean() for read-only queries
const donors = await Donor.find().lean();

// Index important fields
donorSchema.index({ email: 1 });
donorSchema.index({ bloodGroup: 1, location: 1 });

// Use select to limit fields
const donor = await Donor.findById(id).select('name email bloodGroup');
```

### Supabase
```javascript
// Always check for errors
const { data, error } = await supabase.from('donors').select('*');
if (error) throw error;

// Create indexes in SQL
CREATE INDEX idx_donors_email ON donors(email);
CREATE INDEX idx_donors_blood_location ON donors(blood_group, location);

// Select specific fields
const { data: donor } = await supabase
  .from('donors')
  .select('name, email, blood_group')
  .eq('id', id)
  .single();
```

---

## 📈 Performance Tips

### MongoDB
- Use indexes on frequently queried fields
- Use `lean()` for read-only operations
- Avoid `$where` operator
- Use projection to limit returned fields
- Use aggregation pipeline for complex queries

### Supabase
- Create indexes on foreign keys and search fields
- Use `select()` to fetch only needed columns
- Enable RLS (Row Level Security) for security
- Use database views for complex queries
- Leverage PostgreSQL full-text search

---

## 🔄 Migration Script Example

```javascript
// Migrate a donor from MongoDB to Supabase
async function migrateDonor(mongoDonor) {
  const supabaseDonor = {
    name: mongoDonor.name,
    email: mongoDonor.email,
    password: mongoDonor.password,
    blood_group: mongoDonor.bloodGroup,  // Convert to snake_case
    location: mongoDonor.location,
    phone_number: mongoDonor.phoneNumber,  // Convert to snake_case
    status: mongoDonor.status,
    verified: mongoDonor.verified,
    verification_note: mongoDonor.verificationNote,
    last_donation_date: mongoDonor.lastDonationDate,
    created_at: mongoDonor.createdAt
  };
  
  const { data, error } = await supabase
    .from('donors')
    .insert(supabaseDonor)
    .select()
    .single();
  
  if (error) {
    console.error('Migration failed:', error);
    return null;
  }
  
  return data;
}
```

---

This comparison guide should help you understand the differences and make the switch smoothly! 🚀
