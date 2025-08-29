import { useEffect, useState } from 'react'
import { TailSpin } from 'react-loader-spinner'
import './css/Loading.css'

function Loading({ minTime = 2500 , onFinish }) {
    const [opened, setOpened] = useState(false)
    const [flash, setFlash] = useState(false)

    useEffect(() => {
        const flashDuration = 300
        const afterFlashDelay = 500

        const timer = setTimeout(() => {
            setFlash(true)

            setTimeout(() => {
                setOpened(true)
                if (onFinish) {
                    setTimeout(onFinish, afterFlashDelay)
                }
            }, flashDuration)
        }, minTime)

        return () => clearTimeout(timer)
    }, [minTime, onFinish])

    return (
        <div className={`loading-container ${opened ? 'opened' : ''}`}>
            <div className="background-shake" />
            {flash && <div className="white-flash" />}
            <div className="loading-content">
                <div className='shake-sync'>
                    <div className="spinner-wrapper">
                        <TailSpin
                            height="230"
                            width="230"
                            color="#cccccc"
                            ariaLabel="tail-spin-loading"
                            radius="1"
                            visible={true}
                        />
                        <div className="spinner-text">
                            <span className="typing">CARREGANDO</span>
                            <span className="blinking-cursor">|</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Loading