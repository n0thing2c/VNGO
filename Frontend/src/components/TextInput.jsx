export default function TextInput({label,name,value,onChange})
{
    return(
        <div className = "flex flex-col relative">
            <div>
                <label>{label}</label>
      <input type="text" name={name} value={value} onChange={onChange} />
            </div>
        </div>
    )
}