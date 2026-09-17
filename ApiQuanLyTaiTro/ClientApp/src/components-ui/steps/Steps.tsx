import { Box } from '@primer/react';
import React from 'react';
import styles from "./Steps.module.css"
import clsx from 'clsx';

export interface IStepData {
    id: number,
    name: string,
    is_active: boolean
}
interface IStepsProps {
    steps: IStepData[],
    onChangedStep?: (step: number) => void
}
const Steps = (props: IStepsProps) => {
    return (
        <Box className={styles.steps}>
            {props.steps.map((f, fIdx) => {
                return (
                    <Box key={fIdx} className={clsx(styles.step, f.is_active ? styles.is_active : "")} onClick={() => {
                        if (props.onChangedStep) props.onChangedStep(f.id)
                    }}
                        sx={{
                            cursor: "pointer"
                        }}
                    >
                        <Box className={styles.step_count}>{f.id}</Box>
                        <Box className={styles.step_text}>{f.name}</Box>
                        {fIdx !== props.steps.length && <Box className={styles.step_arrow}></Box>}
                    </Box>
                );
            })}
            <Box className={clsx(styles.step_end)}>
                <Box className={styles.step_count}>

                </Box>
                <Box className={styles.step_text}>Hoàn thành</Box>
            </Box>
        </Box>
    );
};

export default Steps;