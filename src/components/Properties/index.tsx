import { useState } from 'react'
import { useHouseStore } from '../../store'

function Properties() {
  const [right, setRight] = useState(0)
  const { data, curSelectedFurniture } = useHouseStore()

  return (
    <div className="Properties" style={{ right: right }}>
      {JSON.stringify(curSelectedFurniture, null, 4)}

      <div
        className="drawer-bar"
        onClick={() => {
          setRight(right === 0 ? -240 : 0)
        }}
      ></div>
    </div>
  )
}

export default Properties
