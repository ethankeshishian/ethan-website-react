import { NextResponse } from "next/server";
import { ZOOM } from "../../constants";

export function GET() {
  return NextResponse.redirect(ZOOM, 307);
}
