"use client";

import { fabric } from "fabric";

import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { useEffect, useRef, useState } from "react";
import {
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleCanvasObjectScaling,
  handleCanvasSelectionCreated,
  handleCanvaseMouseMove,
  handleResize,
  initializeFabric,
  renderCanvas,
} from "@/lib/canvas";
import { ActiveElement, Attributes } from "@/types/type";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";

export default function Page() {

  const undo = useUndo();
  const redo = useRedo();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef<boolean>(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isEditingRef = useRef<boolean>(false);

  // Hook to set the element attributes
  // Esto es para que se puedan modificar las propiedades de los objetos, como el tamanio, color, etc
  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: '',
    height: '',
    fontSize: '',
    fontFamily: '',
    fontWeight: '',
    fill: '#aabbcc',
    stroke: '#aabbcc',
  })

  // Hook to get the canvasObjects from the storage
  // Esto es para que los objetos que se dibujan en el canvas se guarden en el storage
  // El storage es un objeto que se guarda en la base de datos, en este caso se guarda en el storage de liveblocks
  const canvasObjects = useStorage((root) => root.canvasObjects);

  // Hook to sync the shape in the storage\
  // Esto es para que los objetos que se dibujan en el canvas se guarden en el storage
  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;

    const { objectId } = object;

    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get("canvasObjects");

    canvasObjects.set(objectId, shapeData);
  }, []);

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });

  // Hook to delete all the shapes
  // useMutation is a hook that allows you to perform a mutation on the storage
  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects");

    if (!canvasObjects || canvasObjects.size === 0) {
      return true;
    }

    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }

    return canvasObjects.size === 0;
  }, []);

  // Hook to delete a shape from the storage
  const deleteShapeFromStorage = useMutation(({ storage }, objectId) => {
    const canvasObjects = storage.get("canvasObjects");

    canvasObjects.delete(objectId);
  }, []);

  // Eliminar un objeto del canvas al apretar la tecla delete
  // Hook para eliminar un objeto del canvas al presionar la tecla "Delete"
  useEffect(() => {
    const handleDeleteKeyPress = (event: { key: string }) => {
      if (event.key === "Delete") {
        const activeObject = fabricRef.current?.getActiveObject();
        if (activeObject) {
          fabricRef.current?.remove(activeObject);
          // Obtén el ID del objeto y elimínalo del storage
          const objectId = activeObject.get("objectId");
          deleteShapeFromStorage(objectId);
        }
      }
    };

    // Agrega el event listener para la tecla "Delete"
    document.addEventListener("keydown", handleDeleteKeyPress);

    // Remueve el event listener cuando el componente se desmonta
    return () => {
      document.removeEventListener("keydown", handleDeleteKeyPress);
    };
  }, [deleteShapeFromStorage]);

  // Handle the active element in the navbar
  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      // Reset the canvas
      case "reset":
        deleteAllShapes();
        fabricRef.current?.clear();
        // Este es el elemento activo por defecto, el del puntero
        setActiveElement(defaultNavElement);
        break;

      // Delete the selected shape
      case "delete":
        handleDelete(fabricRef.current as any, deleteShapeFromStorage);
        setActiveElement(defaultNavElement);
        break

      // Open the image input, so the user can upload an image
      case "image":
        imageInputRef.current?.click();
        isDrawing.current = false;

        // Set the drawing mode to false
        // fabricRef.current quiere decir que el canvas esta activo
        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
        break;

      default:
        break;
    }

    selectedShapeRef.current = elem?.value as string;
  };

  // Initialize fabric canvas
  // Este es el que renderiza el canvas, dependiendo de la forma seleccionada, por defecto es un rectángulo
  useEffect(() => {
    const canvas = initializeFabric({ canvasRef, fabricRef });

    // Set the canvas to the fabricRef
    // Esto es para poder acceder al canvas desde cualquier parte del componente, dibuja el componente seleccionado
    canvas.on("mouse:down", (options: any) => {
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
      });
    });

    // Cuando el mouse se mueve, se actualiza la posición y tamanio del objeto, si decido crear un rectangulo, al empezar puedo dar click y arraztrar el mouse para darle tamanio
    canvas.on("mouse:move", (options: any) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
      });
    });

    // Cuando se suelta el mouse, se deja de dibujar, si no tiene esto sigue dibujando infinitamente
    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
        activeObjectRef,
      });
    });

    // Cuando se modifica un objeto, se actualiza el objeto en el storage
    // Con esto los demas usuarios pueden ver cuando muevo de posicion un objeto
    canvas.on("object:modified", (options: any) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      });
    });

    // Cuando se selecciona un objeto, Obtenemos las propiedades del objeto,asi como su width, height, etc
    canvas.on("selection:created", (options: any) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      })
    })

    // Cuando se escala un objeto, se actualiza el objeto en el storage
    canvas.on("object:scaling", (options: any) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes,
      })
    })

    // Ayuda a cambiar el tamanio de los objetos
    window.addEventListener("resize", () => {
      // no da error con "canvas"
      handleResize({ canvas: fabricRef.current });
    });

    // undo y redo ayudan a deshacer y rehacer acciones, en este caso sirve para copiar y pegar,
    // Tambien sirve el ctrl + z y ctrl + y
    window.addEventListener("keydown", (e: any) => {
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        deleteShapeFromStorage,
        syncShapeInStorage,
      })
    })

    // si no me equivoco, esto es para que se limpie el canvas cuando se desmonta el componente
    return () => {
      canvas.dispose();
    };
  }, []);

  // Render the canvas objects
  // Esto es para que el resto de los usuarios vean lo que estoy dibujando, sin embargo con solo esto no pueden ver cuando muevo el objeto
  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    });
  }, [canvasObjects]);

  return (
    <main className="h-screen overflow-hidden">
      <Navbar
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
        imageInputRef={imageInputRef}
        handleImageUpload={(e: any) => {
          e.stopPropagation();

          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          })
        }}
      />

      <section className="flex h-full flex-row">
        <LeftSidebar allShapes={Array.from(canvasObjects)} />

        <Live canvasRef={canvasRef} undo={undo} redo={redo}/>

        <RightSidebar 
          elementAttributes={elementAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          activeObjectRef={activeObjectRef}
          isEditingRef={isEditingRef}
          syncShapeInStorage={syncShapeInStorage}
        />
      </section>
    </main>
  );
}
