import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, DocsPage, Note, P, Section, Step, Steps } from "@/components/docs/Docs";
import { API_BASE_URL } from "@/lib/docs/nav";

export const metadata: Metadata = {
  title: "Flutter — Docs — Fewchurs",
  description: "Use Fewchurs in your Flutter app.",
};

const TOC = [
  { id: "status", label: "Package status" },
  { id: "use-the-api", label: "Use the API today" },
  { id: "next", label: "What's next" },
];

const INSTALL = `flutter pub add http shared_preferences`;

const CLIENT = `import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class Fewchurs {
  Fewchurs(this.apiKey);

  final String apiKey;
  static const baseUrl = '${API_BASE_URL}';

  Future<List<dynamic>> topRequests() async {
    final json = await _send(
      http.get(Uri.parse('$baseUrl/features?sort=top'), headers: await _headers()),
    );
    return json['features'] as List<dynamic>;
  }

  Future<void> vote(String featureId) async {
    await _send(
      http.post(Uri.parse('$baseUrl/features/$featureId/vote'), headers: await _headers()),
    );
  }

  Future<void> suggest(String title, {String description = ''}) async {
    await _send(http.post(
      Uri.parse('$baseUrl/features'),
      headers: await _headers(),
      body: jsonEncode({'title': title, 'description': description}),
    ));
  }

  // Made once, then saved. This is how votes are remembered.
  Future<String> _deviceId() async {
    final prefs = await SharedPreferences.getInstance();
    var id = prefs.getString('fewchurs_device_id');
    if (id == null) {
      final random = Random.secure();
      id = List.generate(16, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
      await prefs.setString('fewchurs_device_id', id);
    }
    return id;
  }

  Future<Map<String, String>> _headers() async => {
        'Authorization': 'Bearer $apiKey',
        'X-Device-Id': await _deviceId(),
        'Content-Type': 'application/json',
      };

  Future<Map<String, dynamic>> _send(Future<http.Response> call) async {
    final response = await call;
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) throw Exception(json['error']['message']);
    return json;
  }
}`;

const USE = `final fewchurs = Fewchurs('fr_live_xxx');

final requests = await fewchurs.topRequests();
await fewchurs.vote(requests.first['id']);`;

export default function FlutterDocsPage() {
  return (
    <DocsPage
      path="/docs/flutter"
      title="Flutter"
      intro="The Flutter package is on the way. Until then, you can call the REST API with a small Dart class."
      meta="Works on Android, iOS, web, macOS, Windows and Linux."
      toc={TOC}
    >
      <Section id="status" title="Package status">
        <Note title="Coming soon">
          The Flutter package will give you a ready-made board that uses your app&apos;s theme.
          It isn&apos;t released yet.
        </Note>
      </Section>

      <Section id="use-the-api" title="Use the API today">
        <Steps>
          <Step title="Add two packages">
            <CodeBlock code={INSTALL} />
          </Step>
          <Step title="Add a small client">
            <P>
              Copy this class into your app. It makes a device ID once and sends your key with
              every call.
            </P>
            <CodeBlock code={CLIENT} filename="lib/fewchurs.dart" />
          </Step>
          <Step title="Use it">
            <CodeBlock code={USE} />
          </Step>
        </Steps>
        <P>
          It&apos;s fine to put the API key in your app. It can only do what the board does.
        </P>
      </Section>

      <Section id="next" title="What's next">
        <P>
          The <A href="/docs/api">REST API reference</A> lists every call: comments, following,
          paging and errors.
        </P>
      </Section>
    </DocsPage>
  );
}
