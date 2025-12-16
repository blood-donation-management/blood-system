const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = require('./config/supabase');

async function setupDatabase() {
  console.log('🔍 Checking Supabase database setup...\n');

  try {
    // Check if donors table exists
    const { data: donors, error: donorsError } = await supabase
      .from('donors')
      .select('count')
      .limit(1);

    if (donorsError) {
      console.log('❌ Donors table not found or error:', donorsError.message);
      console.log('\n📋 You need to create the tables in Supabase Dashboard.');
      console.log('   Go to: https://wwhfxrgjeparrccoojjb.supabase.co');
      console.log('   Navigate to: SQL Editor');
      console.log('   Run the SQL from: MONGODB_TO_SUPABASE_MIGRATION.md\n');
      return false;
    }

    console.log('✅ Donors table exists');

    // Check blood_requests table
    const { data: requests, error: requestsError } = await supabase
      .from('blood_requests')
      .select('count')
      .limit(1);

    if (requestsError) {
      console.log('❌ Blood_requests table not found');
      return false;
    }

    console.log('✅ Blood_requests table exists');

    // Check notifications table
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1);

    if (notificationsError) {
      console.log('❌ Notifications table not found');
      return false;
    }

    console.log('✅ Notifications table exists');

    console.log('\n✅ All required tables exist!');
    console.log('✅ Database setup is complete!\n');
    return true;

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    return false;
  }
}

setupDatabase().then((success) => {
  if (!success) {
    console.log('\n⚠️  Please set up your database tables first.');
    console.log('    See MONGODB_TO_SUPABASE_MIGRATION.md for SQL commands.\n');
  }
  process.exit(success ? 0 : 1);
});
