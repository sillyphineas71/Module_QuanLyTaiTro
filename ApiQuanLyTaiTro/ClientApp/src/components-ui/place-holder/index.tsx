import React from "react"
import styles from "./place-holder.module.css"

type PlaceHolderProps = {
    line_number?: number
}
const PlaceHolder = (props: PlaceHolderProps) => {
    const line_number = props.line_number || 3;
    let lines = [];
    for (let index = 0; index < line_number; index++) {
        lines.push(index)
    }
    return (
        <React.Fragment>
            <div style={{ padding: "1rem" }}>
                {lines.map(x => {
                    return (
                        <div key={x} className={styles.load_line} style={{ width: `${(x === 1 ? 100 : 50 + Math.random() * 50)}%` }}>
                            <div className={styles.activity}></div>
                        </div>
                    )
                })}
            </div>
        </React.Fragment>
    )
}
export { PlaceHolder }