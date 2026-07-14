import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

const INTRO_VIDEO = require('../../assets/animation/Animacion.mp4');

// Si el video no dispara "playToEnd" (falla al cargar, etc.) no dejamos al
// usuario atrapado en la intro: se cierra sola pasado este tiempo.
const FALLBACK_TIMEOUT_MS = 8000;
const FADE_OUT_MS = 450;

const IntroScreen = ({ onFinish }) => {
    const [opacity] = useState(() => new Animated.Value(1));
    const finishedRef = useRef(false);

    const player = useVideoPlayer(INTRO_VIDEO, (p) => {
        p.muted = true;
        p.loop = false;
        p.play();
    });

    const handleFinish = () => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        Animated.timing(opacity, {
            toValue: 0,
            duration: FADE_OUT_MS,
            useNativeDriver: true,
        }).start(() => onFinish());
    };

    useEventListener(player, 'playToEnd', handleFinish);

    useEffect(() => {
        const timeout = setTimeout(handleFinish, FALLBACK_TIMEOUT_MS);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity }]}>
            <VideoView
                player={player}
                style={styles.video}
                contentFit="contain"
                nativeControls={false}
                allowsFullscreen={false}
                pointerEvents="none"
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // El video trae su propio fondo negro "quemado" (no es transparente),
        // así que el contenedor combina con ese mismo negro para que no se
        // note la costura arriba/abajo cuando el video no llena la pantalla.
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
});

export default IntroScreen;
