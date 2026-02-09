brainstorming, bitte um feedback:

App soll erst mal für eigenbedarf starten und später erweiterbar sein für firmen (edms)

Es gibt viel code welche man von auto-service übernehmen kann. Wie machen wir es dass sich diese gemeinsame Funktionen teilt?

Anforderungen:
- JPG/PNG/Fotos per Handy/Tablet oder PDFs ohne Text -> mistral ocr -> als PDF mit Text neu speichern -> Auto Tagging mit mistarl small -> RAG
- PDF mit text -> kein mistral ocr pdf2md, pdf2json -> Auto tagging mit mistral small -> RAG 

Ideal wäre wenn der mistral small auch gleich strukturierte daten in eine db wie instantdb oder supaerbase speicher könnte. 

superbase cool da sql + vectordb möglich?

und ja man soll über chat daten abfragen können.

Wenn man dann irgendwie strukturierte daten daraus in einer ui zeigen könnte wäre cool mit auto spalten erkennung, ideen?

Ich denke vecrcel ai sdk wäre gut oder?

und ja später soll eine handy app es geben können daher der flow von web app zu apk wäre cool wenn einfach

ich mag vue und ts, aber bin auch fan von rust, rust wäre auch praktisch für ggf. hosting -> nur eine exe, daher ggf. taruri?
