"use client"

import React, {useState} from "react"
import {ChevronDownIcon} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Calendar} from "@/components/ui/calendar"
import {Label} from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {Calendar1Icon} from "lucide-react";

export function Calendar22({
                               date,
                               onSelect,
                               buttonClassName = "w-48 justify-between font-normal",
                               popoverClassName = "w-auto overflow-hidden p-0",
                           }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={buttonClassName}>
                        {date ? date.toLocaleDateString() : ""}
                        <Calendar1Icon/>
                        {/*<ChevronDownIcon/>*/}
                    </Button>

                </PopoverTrigger>
                <PopoverContent className={popoverClassName} align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        fromYear={new Date().getFullYear()}
                        toYear={new Date().getFullYear() + 1}
                        onSelect={(selectedDate) => {
                            if (selectedDate) {
                                onSelect && onSelect(selectedDate)
                                setOpen(false)
                            }
                        }}
                        disabled={(currentDate) => {
                            // return true to disable a date
                            const today = new Date();
                            today.setHours(0, 0, 0, 0); // ignore time
                            return currentDate < today;
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
