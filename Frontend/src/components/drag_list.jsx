"use client";

import React, {useState} from "react";
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
import {Trash2, Pencil, Check} from "lucide-react";

function SortableList({item, id, idx, onRemove, onRename}) {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id});
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(item.name);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleRename = () => {
        if (!tempName.trim()) return;
        onRename(tempName);
        setIsEditing(false);
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="cursor-grab active:cursor-grabbing bg-gray-100 px-3 py-2 rounded-lg shadow-sm flex justify-between items-center"
        >
            {isEditing ? (
                <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 mr-2"
                    autoFocus
                />
            ) : (
                <span className="font-medium truncate">
          <span className="mr-2 font-semibold">{idx + 1}.</span> {item.name.split(",")[0]}
        </span>
            )}

            <div className="flex items-center gap-4">

        <span {...listeners} className="cursor-grab p-1 select-none">
          ☰
        </span>
                {isEditing ? (
                    <button onClick={handleRename} className="text-green-600 hover:text-green-800">
                        <Check className="w-4 h-4"/>
                    </button>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800">
                        <Pencil className="w-4 h-4"/>
                    </button>
                )}
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

export default function DragList({items, onRemoveItem, onReorder, onRenameItem}) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
    );

    const handleDragEnd = (event) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((s) => s.name === active.id);
        const newIndex = items.findIndex((s) => s.name === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);

        onReorder(reordered);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((s) => s.name)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                    {items.map((item, idx) => (
                        <SortableList
                            key={item.name}
                            item={item}
                            id={item.name}
                            idx={idx}
                            onRemove={() => onRemoveItem(idx)}
                            onRename={(newName) => onRenameItem(idx, newName)}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}
