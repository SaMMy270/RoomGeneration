// exportSceneToGLB(scene, filename)
// requires GLTFExporter from three/examples
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export function exportSceneToGLB(sceneOrRendererScene, filename = "export.glb") {
    return new Promise((resolve, reject) => {
        // accept either a Scene object (we exposed scene in App) or root group
        const exporter = new GLTFExporter();
        const options = {
            binary: true,
            trs: false,
            onlyVisible: true,
            truncateDrawRange: true,
            embedImages: true,
        };

        exporter.parse(
            sceneOrRendererScene,
            (result) => {
                let output;
                if (result instanceof ArrayBuffer) {
                    output = result;
                } else {
                    // gltf JSON -> convert
                    try {
                        output = Buffer.from(JSON.stringify(result));
                    } catch (e) {
                        console.error(e);
                        reject(e);
                        return;
                    }
                }

                // create blob and download
                const blob = new Blob([output], { type: "application/octet-stream" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                link.remove();
                resolve();
            },
            (err) => {
                console.error("Export error:", err);
                reject(err);
            },
            options
        );
    });
}
