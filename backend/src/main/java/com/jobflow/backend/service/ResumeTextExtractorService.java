package com.jobflow.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class ResumeTextExtractorService {

    private static final Logger log = LoggerFactory.getLogger(ResumeTextExtractorService.class);
    private static final int MAX_CHARS = 4000;

    /**
     * Extrai texto de um ficheiro de currículo (PDF ou DOCX).
     * O texto é truncado a {@value MAX_CHARS} caracteres para caber no contexto do LLM.
     */
    public String extractText(byte[] content, String contentType) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Ficheiro de currículo está vazio.");
        }
        String text;
        if (isPdf(contentType)) {
            text = extractFromPdf(content);
        } else if (isDocx(contentType)) {
            text = extractFromDocx(content);
        } else {
            text = new String(content, StandardCharsets.UTF_8);
        }
        return truncate(text);
    }

    private String extractFromPdf(byte[] content) {
        try (PDDocument document = Loader.loadPDF(content)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        } catch (IOException e) {
            log.warn("Falha ao extrair texto do PDF: {}", e.getMessage());
            throw new IllegalArgumentException("Não foi possível extrair texto do PDF. Verifique se o ficheiro não está protegido.");
        }
    }

    private String extractFromDocx(byte[] content) {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(content));
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        } catch (IOException e) {
            log.warn("Falha ao extrair texto do DOCX: {}", e.getMessage());
            throw new IllegalArgumentException("Não foi possível extrair texto do DOCX.");
        }
    }

    private static boolean isPdf(String contentType) {
        return contentType != null && contentType.contains("pdf");
    }

    private static boolean isDocx(String contentType) {
        return contentType != null && (contentType.contains("wordprocessingml") || contentType.contains("docx"));
    }

    private static String truncate(String text) {
        if (text == null) return "";
        String clean = text.strip();
        return clean.length() > MAX_CHARS ? clean.substring(0, MAX_CHARS) + "…" : clean;
    }
}
