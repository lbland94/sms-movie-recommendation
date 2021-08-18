import app from './App';
import CONFIG from './config/config';

const PORT = CONFIG.PORT;

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
