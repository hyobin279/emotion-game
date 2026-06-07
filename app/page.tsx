"use client";

import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";

const questions = [
  {
    emoji: "😢",
    answer: "sad",
    text: "슬픈 표정을 따라해보세요!",
  },
  {
    emoji: "😊",
   answer: "happy",
    text: "기쁜 표정을 따라해보세요!",
  },
  {
    emoji: "😲",
    answer: "surprised",
    text: "놀란 표정을 따라해보세요!",
  },
];

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("AI 모델 로딩 중...");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);

  const question = questions[currentQuestion];

  useEffect(() => {
    loadModels();
    startVideo();
  }, []);

  const loadModels = async () => {
    const MODEL_URL = "/models";

    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

    setLoaded(true);
    setMessage("표정을 따라해보세요!");
  };

  const startVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  useEffect(() => {
    if (!loaded) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detection) return;

      const expressions = detection.expressions;

      const bestMatch = Object.keys(expressions).reduce((a, b) =>
        expressions[a as keyof typeof expressions] >
        expressions[b as keyof typeof expressions]
          ? a
          : b
      );

      if (
        bestMatch === question.answer &&
        expressions[
          bestMatch as keyof typeof expressions
        ] > 0.7
      ) {
        setMessage("정말 잘했어요! 🎉");
        setScore((prev) => prev + 10);

        setTimeout(() => {
          if (currentQuestion + 1 < questions.length) {
            setCurrentQuestion((prev) => prev + 1);
            setMessage("다음 표정을 따라해보세요!");
          } else {
            setMessage("게임 완료! 🌟");
          }
        }, 1500);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [loaded, currentQuestion]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FFF8F0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "30px",
          width: "100%",
          maxWidth: "500px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            color: "#FF8FAB",
          }}
        >
          마음별 탐험대
        </h1>

        <h2
          style={{
            color: "#FFD966",
          }}
        >
          점수: {score}
        </h2>

        <div
          style={{
            fontSize: "100px",
            margin: "20px 0",
          }}
        >
          {question.emoji}
        </div>

        <p
          style={{
            fontSize: "24px",
            color: "#555",
          }}
        >
          {question.text}
        </p>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            borderRadius: "20px",
            marginTop: "20px",
          }}
        />

        <div
          style={{
            marginTop: "20px",
            fontSize: "22px",
            color: "#FF8FAB",
            fontWeight: "bold",
          }}
        >
          {message}
        </div>
      </div>
    </main>
  );
}
