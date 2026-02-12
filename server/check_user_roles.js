const { query } = require('./src/database/connection');

async function checkUser() {
    const email = 'vonj@marcoby.com';
    console.log(`Checking roles for ${email}...`);

    const result = await query(
        "SELECT role, user_id, email, groups FROM user_profiles WHERE email = $1 OR user_id = 'vonj'",
        [email]
    );

    if (result.error) {
        console.error('Error querying database:', result.error);
        process.exit(1);
    }

    if (result.data && result.data.length > 0) {
        console.log('User profiles found:');
        console.table(result.data);
    } else {
        console.log('No user profiles found.');
    }
}

checkUser().catch(err => {
    console.error(err);
    process.exit(1);
});
