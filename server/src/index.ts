import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Nexus API server running on port ${port}`);
}); 