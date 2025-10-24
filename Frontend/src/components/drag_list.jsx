"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {Trash2} from "lucide-react";

function SortableList({ item, id, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="cursor-grab active:cursor-grabbing bg-gray-100 px-3 py-2 rounded-lg shadow-sm flex justify-between items-center"
    >
      <span className="font-medium truncate">{item.name.split(",")[0]}</span>
      <div className="flex items-center gap-2">
        <span {...listeners} className="cursor-grab p-1">
          ☰
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-2 text-red-500 hover:text-red-700 font-bold"
        >
          <Trash2 className="w-4 h-4 text-red-500"/>
        </button>
      </div>
    </li>
  );
}

export default function DragList({ items, onRemoveItem, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((s) => s.name === active.id);
    const newIndex = items.findIndex((s) => s.name === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    onReorder(reordered);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((s) => s.name)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <SortableList
              key={item.name}
              item={item}
              id={item.name}
              onRemove={() => onRemoveItem(idx)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
