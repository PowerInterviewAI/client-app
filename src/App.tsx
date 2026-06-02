import { RouterProvider } from 'react-router-dom';

import MainFrame from './components/custom/main-frame';
import Providers from './components/custom/providers';
import { router } from './router';

function App() {
  return (
    <Providers>
      <MainFrame>
        <RouterProvider router={router} />
      </MainFrame>
    </Providers>
  );
}

export default App;
