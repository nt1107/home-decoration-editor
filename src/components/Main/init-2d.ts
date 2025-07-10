import * as THREE from 'three'
import { MapControls, TransformControls } from 'three/examples/jsm/Addons.js'
import type { Action } from '../../store'

export function init2D(
  dom: HTMLElement,
  updateFurniture: Action['updateFurniture']
) {
  const scene = new THREE.Scene()

  const axesHelper = new THREE.AxesHelper(50000)
  scene.add(axesHelper)

  const directionalLight = new THREE.DirectionalLight(0xffffff)
  directionalLight.position.set(500, 400, 300)
  scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 2.5)
  scene.add(ambientLight)

  const width = window.innerWidth
  const height = window.innerHeight - 60

  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 100000)
  camera.position.set(0, 10000, 0)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  renderer.setSize(width, height)
  renderer.setClearColor('lightblue')

  dom.append(renderer.domElement)

  window.onresize = function () {
    const width = window.innerWidth
    const height = window.innerHeight - 60

    renderer.setSize(width, height)

    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const controls = new MapControls(camera, renderer.domElement)
  controls.enableRotate = false

  const transformControls = new TransformControls(camera, renderer.domElement)
  transformControls.showY = false

  const transformHelper = transformControls.getHelper()
  scene.add(transformHelper)

  transformControls.addEventListener('dragging-changed', function (event) {
    controls.enabled = !event.value
  })

  transformControls.addEventListener('change', () => {
    const obj = transformControls.object

    if (obj) {
      if (transformControls.mode === 'translate') {
        updateFurniture(
          obj.name,
          'position',
          new THREE.Vector3(-obj.position.x, -obj.position.y, -obj.position.z)
        )
      } else if (transformControls.mode === 'rotate') {
        updateFurniture(
          obj.name,
          'rotation',
          new THREE.Vector3(obj.rotation.x, obj.rotation.y, obj.rotation.z)
        )
      }
    }
  })

  renderer.domElement.addEventListener('click', (e) => {
    const y = -((e.offsetY / height) * 2 - 1)
    const x = (e.offsetX / width) * 2 - 1

    const rayCaster = new THREE.Raycaster()
    rayCaster.setFromCamera(new THREE.Vector2(x, y), camera)

    const furnitures = scene.getObjectByName('furnitures')!
    const intersections2 = rayCaster.intersectObjects(furnitures.children)

    if (intersections2.length) {
      const obj = intersections2[0].object as THREE.Object3D & {
        target?: THREE.Object3D
      }
      if (obj.target) {
        transformControls.attach(obj.target)
      }
    } else {
      transformControls.detach()
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
      transformControls.showY = true
    }
  }

  function render() {
    controls.update()
    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }

  render()

  return {
    scene,
    changeMode
  }
}
