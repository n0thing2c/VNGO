"use client";

import React, { useEffect, useState } from "react";
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
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Pencil, Check, GripVertical } from "lucide-react";

// Giới hạn ký tự cho mô tả
const MAX_DESC_LENGTH = 250;

// Component con: 1 Dòng địa điểm
function SortableItem({ item, id, idx, onRemove, onRename, onUpdateDescription }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(item.name);
    
    // State cho phần Description
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    // State để đếm ký tự realtime
    const [descValue, setDescValue] = useState(item.description || "");

    // Cập nhật lại state khi props item thay đổi (đề phòng drag drop xong bị sai content)
    useEffect(() => {
        setDescValue(item.description || "");
        setTempName(item.name);
    }, [item.description, item.name]);
    
    // Style cho hiệu ứng kéo thả
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto", // Đưa item đang kéo lên trên cùng
        opacity: isDragging ? 0.9 : 1,
    };

    const handleRenameSave = () => {
        if (!tempName.trim()) return;
        onRename(tempName);
        setIsEditingName(false);
    };

    const handleDescSave = (e) => {
        // Lưu khi blur hoặc bấm nút save (ở đây ta dùng onBlur cho tiện)
        onUpdateDescription(idx, e.target.value);
        setIsEditingDesc(false);
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`
                group flex flex-col gap-2 p-3 rounded-xl border transition-all mb-3
                ${isDragging ? "bg-blue-50 border-blue-300 shadow-lg" : "bg-white border-gray-200 shadow-sm hover:shadow-md"}
            `}
        >
            {/* --- HÀNG 1: Handle, Số thứ tự, Tên, Nút Xóa --- */}
            <div className="flex items-center gap-3">
                {/* Nút nắm để kéo (Handle) */}
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                    <GripVertical size={20} />
                </div>

                {/* Số thứ tự */}
                <div className="flex-shrink-0 w-7 h-7 bg-[#068F64] text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                </div>

                {/* Phần Tên (View/Edit) */}
                <div className="flex-1 min-w-0">
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleRenameSave}
                                onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
                                className="flex-1 border border-[#068F64] rounded px-2 py-1 text-sm outline-none bg-gray-50"
                                autoFocus
                            />
                            <button 
                                onClick={handleRenameSave}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                                <Check size={18} />
                            </button>
                        </div>
                    ) : (
                        <div 
                            className="flex items-center gap-2 cursor-pointer group/name" 
                            onClick={() => setIsEditingName(true)}
                        >
                            <span className="font-semibold text-gray-800 truncate select-none">
                                {item.name.split(",")[0]}
                            </span>
                            <Pencil size={18} className="text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>

                {/* Nút Xóa */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Ngăn sự kiện drag
                        onRemove();
                    }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Remove stop"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* --- HÀNG 2: Inline Description --- */}
            <div className="pl-11 pr-2">
                {isEditingDesc ? (
                    <div className="relative">
                        <textarea
                            className="w-full text-sm p-3 border rounded-lg focus:outline-none focus:border-[#068F64] focus:ring-1 focus:ring-[#068F64] bg-gray-50 resize-y min-h-[80px]"
                            placeholder="Suggestion: At what time? What are the activities? What's special about this place?"
                            defaultValue={item.description || ""}
                            onBlur={(e) => {
                                handleDescSave(e);
                                setIsEditingDesc(false);
                            }}
                            autoFocus
                        />
                        <div className="absolute bottom-2 left-2 text-xs text-gray-400">
                            Click outside to save
                        </div>
                        {/* Bộ đếm ký tự */}
                        <div className={`
                            absolute bottom-2 right-2 text-[10px] font-medium pointer-events-none
                            ${descValue.length >= MAX_DESC_LENGTH ? "text-red-500" : "text-gray-400"}
                        `}>
                            {descValue.length}/{MAX_DESC_LENGTH}
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => setIsEditingDesc(true)}
                        className={`
                            cursor-pointer text-sm p-2 rounded-lg border border-transparent 
                            hover:bg-gray-50 hover:border-dashed hover:border-gray-300 transition-all
                            ${!item.description ? "text-gray-400 italic" : "text-gray-600"}
                        `}
                    >
                        {item.description ? (
                            <p className="line-clamp-2 leading-relaxed">
                                {item.description}
                            </p>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Pencil size={12} /> Add a description...
                            </span>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
}

// Component chính
export default function DragList({ items, onRemoveItem, onReorder, onRenameItem, onUpdateDescription }) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1, // Di chuyển chuột 1px mới tính là drag (tránh click nhầm)
            },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Lưu ý: Dùng item.name làm ID có rủi ro nếu trùng tên. 
        // Nếu backend có ID (item.id) thì nên dùng item.id thay vì item.name
        const oldIndex = items.findIndex((s) => s.name === active.id);
        const newIndex = items.findIndex((s) => s.name === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
             const reordered = arrayMove(items, oldIndex, newIndex);
             onReorder(reordered);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((s) => s.name)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1 pb-4">
                    {items.map((item, idx) => (
                        <SortableItem
                            key={item.name + idx} // Fallback key để tránh lỗi duplicate key react
                            item={item}
                            id={item.name}
                            idx={idx}
                            onRemove={() => onRemoveItem(idx)}
                            onRename={(newName) => onRenameItem(idx, newName)}
                            onUpdateDescription={onUpdateDescription}
                        />
                    ))}
                    {items.length === 0 && (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
                            <p>No places added yet. Click on the map to add stops.</p>
                        </div>
                    )}
                </ul>
            </SortableContext>
        </DndContext>
    );
}