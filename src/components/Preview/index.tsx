import { CloseCircleOutlined } from "@ant-design/icons";
import { initPreviewScene } from './init-preview'
import { useEffect } from "react";
import { useHouseStore } from '../../store'

function Preview() {

  useEffect(() => {
    const dom = document.getElementById('preview-container')!;
    const { } = initPreviewScene(dom);

    return () => {
      dom.innerHTML = '';
    }
}, []);

const { showPreview, toggleShowPreview } = useHouseStore();
  return <div id="preview" style={{display: showPreview ? 'block' :  'none'}}>
    <div id="preview-container"></div>
    <div className='close-btn' onClick={toggleShowPreview}>
      <CloseCircleOutlined />
    </div>
  </div>
}

export default Preview;
