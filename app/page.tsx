import dynamic from 'next/dynamic';

// sirve para cargar el componente de manera dinamica, esto ya que el componente tiene un useEffect que se ejecuta al montar el componente entonces si se carga de manera estatica, se ejecutara el useEffect al cargar la pagina y no al cargar el componente
// Esto evita ciertos problemas al hacer el despliegue
const App = dynamic(() => import('./App'), { ssr: false })

export default App;