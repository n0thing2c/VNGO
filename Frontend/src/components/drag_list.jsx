"use client";

import React, {useEffect, useState} from "react";
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
import {Trash2, Pencil, Check, Text, X} from "lucide-react";

function SortableList({item, id, idx, onRemove, onRename, onUpdateDescription}) {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id});
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(item.name);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
    const [tempDescription, setTempDescription] = useState(item.description || "");

    useEffect(() => {
        setTempDescription(item.description || "");
    }, [item.description]);

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
                        setIsDescriptionOpen(true);
                    }}
                    className="text-purple-600 hover:text-purple-800"
                    title="Add stop description"
                >
                    <Text className="w-4 h-4"/>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-2 text-red-500 hover:text-red-700 font-bold"
                >
                    <Trash2 className="w-4 h-4 text-red-500"/>
                </button>
                {item.description && (
                    <span className="text-xs text-purple-600 font-medium">Has description</span>
                )}
            </div>

            {isDescriptionOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Stop description</h2>
                            <button
                                onClick={() => setIsDescriptionOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">
                            {idx + 1}. {item.name.split(",")[0]}
                        </p>
                        <textarea
                            value={tempDescription}
                            onChange={(e) => setTempDescription(e.target.value)}
                            rows={5}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="Add details for this stop"
                        />
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setTempDescription("")}
                                className="text-sm text-red-500 hover:text-red-700"
                            >
                                Clear description
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsDescriptionOpen(false)}
                                    className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => {
                                        onUpdateDescription && onUpdateDescription(idx, tempDescription.trim());
                                        setIsDescriptionOpen(false);
                                    }}
                                    className="rounded-md bg-purple-600 px-3 py-1 text-sm font-semibold text-white hover:bg-purple-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </li>
    );
}

export default function DragList({items, onRemoveItem, onReorder, onRenameItem, onUpdateDescription}) {
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
                            onUpdateDescription={onUpdateDescription}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}