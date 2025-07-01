import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useHouseStore } from '../../store'
import { init3D } from './init-3d'
import { init2D } from './init-2d'
import { Button } from 'antd'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'

let winModel: { model: THREE.Group; size: THREE.Vector3 } | null = null

async function loadWindow() {
  if (winModel !== null) {
    return winModel
  } else {
    const group = new THREE.Group()
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync('./window.glb')
    group.add(gltf.scene)

    const box = new THREE.Box3()
    box.expandByObject(gltf.scene)

    const size = box.getSize(new THREE.Vector3())
    console.log('size', size)
    winModel = {
      model: group,
      size
    }

    return winModel
  }
}

function Main() {
  const scene3DRef = useRef<THREE.Scene>(null)
  const scene2DRef = useRef<THREE.Scene>(null)
  const { data } = useHouseStore()

  // 2D容器
  useEffect(() => {
    const dom = document.getElementById('threejs-2d-container')
    if (dom) {
      const { scene } = init2D(dom)
      scene2DRef.current = scene
    }
    return () => {
      if (dom) {
        dom.innerHTML = ''
      }
    }
  }, [])
  // 3D容器
  useEffect(() => {
    const dom = document.getElementById('threejs-3d-container')
    // const { scene } = dom ? init3D(dom) : { scene: null }
    if (dom) {
      const { scene } = init3D(dom)
      scene3DRef.current = scene
    }

    return () => {
      if (dom) {
        dom.innerHTML = ''
      }
    }
  }, [])
  // 2D绘制
  useEffect(() => {
    // const scene = scene2DRef.current!
    // const walls = data.walls.map((item) => {
    //   const shape = new THREE.Shape()
    //   shape.moveTo(item.p1.x, item.p1.z)
    //   shape.lineTo(item.p2.x, item.p2.z)
    //   shape.lineTo(item.p3.x, item.p3.z)
    //   shape.lineTo(item.p4.x, item.p4.z)
    //   shape.lineTo(item.p1.x, item.p1.z)
    //   const geometry = new THREE.ShapeGeometry(shape)
    //   const material = new THREE.MeshPhongMaterial({
    //     color: 'white'
    //   })
    //   const wall = new THREE.Mesh(geometry, material)
    //   wall.rotateX(-Math.PI / 2)
    //   return wall
    // })
    // scene.add(...walls)
  }, [data])
  // 3D绘制
  useEffect(() => {
    const scene = scene3DRef.current!
    const walls = data.walls.map((item) => {
      const shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.lineTo(0, item.height)
      shape.lineTo(item.width, item.height)
      shape.lineTo(item.width, 0)
      shape.lineTo(0, 0)

      item.windows.forEach(async (win) => {
        const path = new THREE.Path()
        const { x, z } = win.leftBottomPosition
        path.moveTo(x, z)
        path.lineTo(x + win.width, z)
        path.lineTo(x + win.width, z + win.height)
        path.lineTo(x, z + win.height)
        path.lineTo(x, z)
        shape.holes.push(path)

        const { model, size } = await loadWindow()
        model.position.x = item.width / 2
        model.position.y = item.height / 2
        model.position.z = item.position.z
        model.scale.set(win.width / size.x, win.height / size.y, 1)
        model.scale.setScalar(200)
        scene.add(model)
      })

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: item.depth
      })
      const material = new THREE.MeshPhongMaterial({
        color: 'white'
      })
      const wall = new THREE.Mesh(geometry, material)
      wall.position.set(item.position.x, item.position.y, item.position.z)
      // wall.rotateX(-Math.PI / 2)
      return wall
    })

    scene.add(...walls)
  }, [data])
  const [curMode, setCurMode] = useState('2d')

  return (
    <div className="Main">
      <div
        id="threejs-3d-container"
        style={{ display: curMode === '3d' ? 'block' : 'none' }}
      ></div>
      <div
        id="threejs-2d-container"
        style={{ display: curMode === '2d' ? 'block' : 'none' }}
      ></div>

      <div className="mode-change-btns">
        <Button
          type={curMode === '2d' ? 'primary' : 'default'}
          onClick={() => setCurMode('2d')}
        >
          2D
        </Button>
        <Button
          type={curMode === '3d' ? 'primary' : 'default'}
          onClick={() => setCurMode('3d')}
        >
          3D
        </Button>
      </div>
    </div>
  )
}

export default Main
