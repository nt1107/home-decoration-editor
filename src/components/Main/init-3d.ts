import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/Addons.js'
import type { Action } from '../../store'

export function init3D(
  dom: HTMLElement,
  wallsVisibilityCalc: () => void,
  updateFurniture: Action['updateFurniture']
) {
  const scene = new THREE.Scene()

  const axesHelper = new THREE.AxesHelper(5000)
  scene.add(axesHelper)

  const directionalLight = new THREE.DirectionalLight(0xffffff)
  directionalLight.position.set(0, 1500, 0)
  scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 2.5)
  scene.add(ambientLight)

  const width = window.innerWidth
  const height = window.innerHeight - 60

  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 100000)
  camera.position.set(6000, 4000, 6000)
  camera.lookAt(0, 0, 0)

  const gridHelper = new THREE.GridHelper(100000, 500, 'white', 'white')
  scene.add(gridHelper)

  const renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  renderer.setSize(width, height)
  renderer.setClearColor('skyblue')

  function render() {
    renderer.render(scene, camera)
    requestAnimationFrame(render)
    wallsVisibilityCalc()
  }

  render()

  dom.append(renderer.domElement)

  window.onresize = function () {
    const size = renderer.getSize(new THREE.Vector2())
    if (size.y === 200) {
      return
    }
    const width = window.innerWidth
    const height = window.innerHeight - 60

    renderer.setSize(width, height)

    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const controls = new OrbitControls(camera, renderer.domElement)
  const transformControls = new TransformControls(camera, renderer.domElement)
  transformControls.showY = false
  const transformHelper = transformControls.getHelper()
  scene.add(transformHelper)

  transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value
  })

  transformControls.addEventListener('change', () => {
    const obj = transformControls.object

    if (obj) {
      if (transformControls.mode === 'translate') {
        updateFurniture(obj.name, 'position', obj.position)
      } else if (transformControls.mode === 'rotate') {
        updateFurniture(
          obj.name,
          'rotation',
          new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z)
        )
      }
    }
  })

  const edges: Array<THREE.Line> = []
  renderer.domElement.addEventListener('click', (e) => {
    const { x: width, y: height } = renderer.getSize(new THREE.Vector2())

    const y = -((e.offsetY / height) * 2 - 1)
    const x = (e.offsetX / width) * 2 - 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
    const intersects = raycaster.intersectObjects(scene.children)

    const furnitures = scene.getObjectByName('furnitures')
    const intersects2 = raycaster.intersectObjects(furnitures?.children ?? [])
    if (intersects2.length) {
      const obj = intersects2[0].object as THREE.Object3D & {
        target?: THREE.Object3D
      }
      if (obj.target) {
        transformControls.attach(obj.target)
      } else {
        transformControls.detach()
      }
    }

    edges.forEach((item) => {
      item.parent?.remove(item)
    })
    if (intersects.length) {
      const obj = intersects[0].object as THREE.Mesh
      if (obj.isMesh) {
        const geometry = new THREE.EdgesGeometry(obj.geometry)
        const material = new THREE.LineBasicMaterial({ color: 'blue' })
        const line = new THREE.LineSegments(geometry, material)
        obj.add(line)
        edges.push(line)
      }
    }
  })

  function changeMode(isTranslate: boolean) {
    if (isTranslate) {
      transformControls.mode = 'translate'
      transformControls.showX = true
      transformControls.showZ = true
      transformControls.showY = false
    } else {
      transformControls.mode = 'rotate'
      transformControls.showX = false
      transformControls.showZ = false
      transformControls.showY = false
    }
  }

  function changeSize(isBig: boolean) {
    if (isBig) {
      const width = window.innerWidth
      const height = window.innerHeight - 60
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    } else {
      const width = 240
      const height = 200

      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
  }

  return {
    scene,
    camera,
    changeMode,
    changeSize
  }
}
