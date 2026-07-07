// intentionally broken: unused import + missing type
import axios from 'axios'

export default function BadComponent() {
  const x: any = axios.get('/foo')
  return <div>{x}</div>
}
