#!/usr/bin/env perl
#
# $Id: make.pl 41858 2017-07-08 07:35:02Z robertj $
#

use strict;
use warnings;

my $size = "400x252";
my $px = "70";

foreach (1..10) {
    system("convert -background lightpink -fill black -size $size -pointsize $px -gravity center label:$_ s$_.png");
    system("pngquant 256 --ext=.png --force s$_.png");

    system("convert -background lightgray -fill black -size $size -pointsize $px -gravity center label:$_ t$_.png");
    system("pngquant 256 --ext=.png --force t$_.png");
}
